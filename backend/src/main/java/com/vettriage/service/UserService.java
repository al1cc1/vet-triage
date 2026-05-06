package com.vettriage.service;

import com.vettriage.dto.user.CreateDoctorRequest;
import com.vettriage.dto.user.UserResponse;
import com.vettriage.model.Clinic;
import com.vettriage.model.Role;
import com.vettriage.model.User;
import com.vettriage.repository.ClinicRepository;
import com.vettriage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ClinicRepository clinicRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse createDoctor(UUID clinicId, CreateDoctorRequest req) {
        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinic not found"));

        if (userRepository.existsByEmailAndClinicId(req.getEmail(), clinicId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        if (req.getPin() == null || !req.getPin().matches("\\d{6}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PIN must be exactly 6 digits");
        }

        User doctor = userRepository.save(User.builder()
                .clinic(clinic)
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPin()))
                .role(Role.DOCTOR)
                .doctorPin(req.getPin())
                .build());

        return new UserResponse(doctor.getId(), doctor.getEmail(), doctor.getRole());
    }

    public List<UserResponse> getDoctors(UUID clinicId) {
        return userRepository.findByClinicIdAndRole(clinicId, Role.DOCTOR).stream()
                .map(u -> new UserResponse(u.getId(), u.getEmail(), u.getRole()))
                .toList();
    }
}
