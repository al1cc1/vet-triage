package com.vettriage.service;

import com.vettriage.dto.auth.*;
import com.vettriage.model.*;
import com.vettriage.repository.ClinicRepository;
import com.vettriage.repository.UserRepository;
import com.vettriage.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final ClinicRepository clinicRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${app.frontend-url:http://localhost:5174}")
    private String frontendUrl;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    private static final String CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$");
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public RegisterResponse registerClinic(RegisterRequest request) {
        if (!PASSWORD_PATTERN.matcher(request.getPassword()).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must be at least 8 characters and contain uppercase, lowercase and a digit");
        }

        if (clinicRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        String hash = passwordEncoder.encode(request.getPassword());

        if (!mailEnabled) {
            log.info("Mail disabled — auto-verifying registration for {}", request.getEmail());
            Clinic clinic = Clinic.builder()
                    .name(request.getName())
                    .email(request.getEmail())
                    .passwordHash(hash)
                    .clinicCode(generateUniqueCode())
                    .emailVerified(true)
                    .build();
            clinic = clinicRepository.save(clinic);
            saveAdminUser(clinic, hash);

            String token = jwtUtil.generateToken(clinic.getEmail(), Role.RECEPTION.name(), clinic.getId().toString());
            return new RegisterResponse(true, "Konto zarejestrowane.", token,
                    Role.RECEPTION.name(), clinic.getClinicCode(), clinic.getId().toString());
        }

        log.info("Sending verification email to: {}", request.getEmail());
        String verificationToken = UUID.randomUUID().toString();
        Clinic clinic = Clinic.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(hash)
                .clinicCode(generateUniqueCode())
                .emailVerified(false)
                .verificationToken(verificationToken)
                .verificationTokenExpiry(LocalDateTime.now().plusHours(24))
                .build();
        clinic = clinicRepository.save(clinic);
        saveAdminUser(clinic, hash);

        emailService.sendVerificationEmail(clinic.getEmail(), clinic.getName(), verificationToken);

        return new RegisterResponse(false,
                "Rejestracja zakończona. Sprawdź swoją skrzynkę email i kliknij link aktywacyjny.",
                null, null, null, null);
    }

    public AuthResponse login(LoginRequest request) {
        Clinic clinic = clinicRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), clinic.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        if (!clinic.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED");
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

    @Transactional
    public String verifyEmail(String token) {
        Clinic clinic = clinicRepository.findByVerificationToken(token)
                .orElseGet(() -> null);

        if (clinic == null) {
            return frontendUrl + "/login?error=invalid-token";
        }

        if (clinic.getVerificationTokenExpiry() != null &&
                clinic.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            clinic.setVerificationToken(null);
            clinic.setVerificationTokenExpiry(null);
            clinicRepository.save(clinic);
            return frontendUrl + "/login?error=invalid-token";
        }

        clinic.setEmailVerified(true);
        clinic.setVerificationToken(null);
        clinic.setVerificationTokenExpiry(null);
        clinicRepository.save(clinic);
        return frontendUrl + "/login?verified=true";
    }

    @Transactional
    public void resendVerification(String email) {
        clinicRepository.findByEmail(email).ifPresent(clinic -> {
            if (clinic.isEmailVerified()) return;

            String token = UUID.randomUUID().toString();
            clinic.setVerificationToken(token);
            clinic.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
            clinicRepository.save(clinic);

            log.info("Sending verification email to: {}", email);
            emailService.sendVerificationEmail(email, clinic.getName(), token);
        });
        // Always return success — never reveal if email exists
    }

    @Transactional
    public void forgotPassword(String email) {
        clinicRepository.findByEmail(email).ifPresent(clinic -> {
            String token = UUID.randomUUID().toString();
            clinic.setResetToken(token);
            clinic.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            clinicRepository.save(clinic);

            log.info("Sending password reset email to: {}", email);
            emailService.sendPasswordResetEmail(email, clinic.getName(), token);
        });
        // Always return success — never reveal if email exists
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (!PASSWORD_PATTERN.matcher(newPassword).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must be at least 8 characters and contain uppercase, lowercase and a digit");
        }

        Clinic clinic = clinicRepository.findByResetToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN"));

        if (clinic.getResetTokenExpiry() == null ||
                clinic.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            clinic.setResetToken(null);
            clinic.setResetTokenExpiry(null);
            clinicRepository.save(clinic);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN");
        }

        String hash = passwordEncoder.encode(newPassword);
        clinic.setPasswordHash(hash);
        clinic.setResetToken(null);
        clinic.setResetTokenExpiry(null);
        clinicRepository.save(clinic);
    }

    private void saveAdminUser(Clinic clinic, String hash) {
        User admin = User.builder()
                .clinic(clinic)
                .email(clinic.getEmail())
                .passwordHash(hash)
                .role(Role.RECEPTION)
                .build();
        userRepository.save(admin);
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
