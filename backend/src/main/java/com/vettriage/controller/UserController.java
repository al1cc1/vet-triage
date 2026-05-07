package com.vettriage.controller;

import com.vettriage.dto.user.CreateDoctorRequest;
import com.vettriage.dto.user.UserResponse;
import com.vettriage.security.ClaimsPrincipal;
import com.vettriage.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Użytkownicy", description = "Zarządzanie lekarzami kliniki")
public class UserController {

    private final UserService userService;

    @PostMapping("/doctors")
    @PreAuthorize("hasRole('RECEPTION')")
    public ResponseEntity<UserResponse> createDoctor(@RequestBody CreateDoctorRequest request,
                                                      Authentication auth) {
        UUID clinicId = UUID.fromString(principal(auth).clinicId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.createDoctor(clinicId, request));
    }

    @GetMapping("/doctors")
    @PreAuthorize("hasRole('RECEPTION')")
    public ResponseEntity<List<UserResponse>> getDoctors(Authentication auth) {
        UUID clinicId = UUID.fromString(principal(auth).clinicId());
        return ResponseEntity.ok(userService.getDoctors(clinicId));
    }

    private ClaimsPrincipal principal(Authentication auth) {
        return (ClaimsPrincipal) auth.getPrincipal();
    }
}
