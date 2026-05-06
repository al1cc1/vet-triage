package com.vettriage.service;

import com.vettriage.dto.auth.*;
import com.vettriage.model.*;
import com.vettriage.repository.ClinicRepository;
import com.vettriage.repository.UserRepository;
import com.vettriage.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final ClinicRepository clinicRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private static final String CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public AuthResponse registerClinic(RegisterRequest request) {
        if (clinicRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        String clinicCode = generateUniqueCode();
        String hash = passwordEncoder.encode(request.getPassword());

        Clinic clinic = Clinic.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(hash)
                .clinicCode(clinicCode)
                .build();
        clinic = clinicRepository.save(clinic);

        User admin = User.builder()
                .clinic(clinic)
                .email(request.getEmail())
                .passwordHash(hash)
                .role(Role.RECEPTION)
                .build();
        userRepository.save(admin);

        String token = jwtUtil.generateToken(clinic.getEmail(), Role.RECEPTION.name(), clinic.getId().toString());
        return new AuthResponse(token, Role.RECEPTION.name(), clinicCode, clinic.getId().toString());
    }

    public AuthResponse login(LoginRequest request) {
        Clinic clinic = clinicRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), clinic.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = jwtUtil.generateToken(clinic.getEmail(), Role.RECEPTION.name(), clinic.getId().toString());
        return new AuthResponse(token, Role.RECEPTION.name(), clinic.getClinicCode(), clinic.getId().toString());
    }

    public AuthResponse doctorLogin(DoctorLoginRequest request) {
        Clinic clinic = clinicRepository.findByClinicCode(request.getClinicCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid clinic code"));

        User doctor = userRepository.findByClinicIdAndRole(clinic.getId(), Role.DOCTOR).stream()
                .filter(u -> request.getDoctorPin().equals(u.getDoctorPin()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid PIN"));

        String token = jwtUtil.generateToken(doctor.getEmail(), Role.DOCTOR.name(), clinic.getId().toString());
        return new AuthResponse(token, Role.DOCTOR.name(), clinic.getClinicCode(), clinic.getId().toString());
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = part(3) + "-" + part(4);
        } while (clinicRepository.existsByClinicCode(code));
        return code;
    }

    private String part(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) sb.append(CHARSET.charAt(random.nextInt(CHARSET.length())));
        return sb.toString();
    }
}
