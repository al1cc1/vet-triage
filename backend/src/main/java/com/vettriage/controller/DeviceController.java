package com.vettriage.controller;

import com.vettriage.dto.device.DeviceRegisterRequest;
import com.vettriage.dto.device.DeviceTokenResponse;
import com.vettriage.service.DeviceTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceTokenService deviceTokenService;

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody DeviceRegisterRequest req) {
        deviceTokenService.registerOrUpdate(
                req.getFcmToken(), req.getClinicCode(), req.getDeviceName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{clinicCode}")
    @PreAuthorize("hasRole('RECEPTION')")
    public ResponseEntity<List<DeviceTokenResponse>> getDevices(
            @PathVariable String clinicCode) {
        return ResponseEntity.ok(deviceTokenService.getDevicesForClinic(clinicCode));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RECEPTION')")
    public ResponseEntity<Void> deleteDevice(@PathVariable UUID id) {
        deviceTokenService.deleteDevice(id);
        return ResponseEntity.noContent().build();
    }
}
