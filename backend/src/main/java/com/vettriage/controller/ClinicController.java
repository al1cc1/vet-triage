package com.vettriage.controller;

import com.vettriage.dto.clinic.ClinicSettingsResponse;
import com.vettriage.dto.clinic.UpdateClinicSettingsRequest;
import com.vettriage.security.ClaimsPrincipal;
import com.vettriage.service.ClinicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/clinic")
@RequiredArgsConstructor
public class ClinicController {

    private final ClinicService clinicService;

    @GetMapping("/settings")
    public ResponseEntity<ClinicSettingsResponse> getSettings(Authentication auth) {
        UUID clinicId = UUID.fromString(principal(auth).clinicId());
        return ResponseEntity.ok(clinicService.getSettings(clinicId));
    }

    @PutMapping("/settings")
    public ResponseEntity<ClinicSettingsResponse> updateSettings(@RequestBody UpdateClinicSettingsRequest req,
                                                                  Authentication auth) {
        UUID clinicId = UUID.fromString(principal(auth).clinicId());
        return ResponseEntity.ok(clinicService.updateSettings(clinicId, req));
    }

    private ClaimsPrincipal principal(Authentication auth) {
        return (ClaimsPrincipal) auth.getPrincipal();
    }
}
