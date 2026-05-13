package com.vettriage.service;

import com.vettriage.dto.auth.AuthResponse;
import com.vettriage.dto.auth.DoctorLoginRequest;
import com.vettriage.dto.auth.MobileLoginRequest;
import com.vettriage.dto.auth.SessionResponse;
import com.vettriage.model.*;
import com.vettriage.repository.ClinicRepository;
import com.vettriage.repository.UserRepository;
import com.vettriage.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final ClinicRepository clinicRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    private static final String CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public SessionResponse registerClinic(String firebaseUid, String email, String clinicName) {
        if (clinicRepository.existsByFirebaseUid(firebaseUid)) {
            Clinic existing = clinicRepository.findByFirebaseUid(firebaseUid).get();
            return new SessionResponse(existing.getId().toString(), existing.getClinicCode());
        }
        Clinic clinic = Clinic.builder()
                .firebaseUid(firebaseUid)
                .name(clinicName.trim())
                .email(email)
                .clinicCode(generateUniqueCode())
                .build();
        clinic = clinicRepository.save(clinic);
        return new SessionResponse(clinic.getId().toString(), clinic.getClinicCode());
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

    public AuthResponse mobileLogin(MobileLoginRequest request) {
        Clinic clinic = clinicRepository.findByClinicCode(request.getClinicCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nieprawidłowy kod kliniki"));

        if (clinic.getMobilePin() == null || !clinic.getMobilePin().equals(request.getClinicPin())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nieprawidłowy PIN");
        }

        String token = jwtUtil.generateToken(
                "mobile:" + clinic.getClinicCode(),
                Role.DOCTOR.name(),
                clinic.getId().toString());
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
