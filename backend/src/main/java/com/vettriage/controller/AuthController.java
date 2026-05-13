package com.vettriage.controller;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.vettriage.dto.auth.*;
import com.vettriage.security.ClaimsPrincipal;
import com.vettriage.service.AuthService;
import com.vettriage.service.ClinicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Autoryzacja", description = "Rejestracja Firebase, logowanie lekarzy, sesja")
public class AuthController {

    private final AuthService authService;
    private final ClinicService clinicService;

    @PostMapping("/register")
    @Operation(summary = "Rejestracja kliniki (Firebase UID z tokenu)")
    public ResponseEntity<SessionResponse> register(@RequestBody FirebaseRegisterRequest req,
                                                     HttpServletRequest httpRequest) {
        log.info("AuthController.register: request received, clinicName='{}'", req.getClinicName());
        String token = extractBearer(httpRequest);
        if (token == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No token");
        FirebaseToken fbToken;
        try {
            if (FirebaseApp.getApps().isEmpty())
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Firebase not initialized");
            fbToken = FirebaseAuth.getInstance().verifyIdToken(token);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Firebase token verification failed: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Firebase token: " + e.getMessage());
        }
        log.info("AuthController.register: token verified, uid='{}', email='{}'", fbToken.getUid(), fbToken.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.registerClinic(fbToken.getUid(), fbToken.getEmail(), req.getClinicName()));
    }

    @PostMapping("/verify-session")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Weryfikacja sesji — zwraca clinicId i clinicCode")
    public ResponseEntity<SessionResponse> verifySession(Authentication auth) {
        UUID clinicId = UUID.fromString(((ClaimsPrincipal) auth.getPrincipal()).clinicId());
        var settings = clinicService.getSettings(clinicId);
        return ResponseEntity.ok(new SessionResponse(clinicId.toString(), settings.getClinicCode()));
    }

    @PostMapping("/doctor-login")
    public ResponseEntity<AuthResponse> doctorLogin(@RequestBody DoctorLoginRequest request) {
        return ResponseEntity.ok(authService.doctorLogin(request));
    }

    @PostMapping("/mobile-login")
    @Operation(summary = "Logowanie aplikacji mobilnej lekarza")
    public ResponseEntity<AuthResponse> mobileLogin(@RequestBody MobileLoginRequest request) {
        return ResponseEntity.ok(authService.mobileLogin(request));
    }

    private String extractBearer(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) return header.substring(7);
        return null;
    }
}
