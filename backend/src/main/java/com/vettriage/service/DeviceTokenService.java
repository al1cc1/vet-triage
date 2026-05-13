package com.vettriage.service;

import com.vettriage.dto.device.DeviceTokenResponse;
import com.vettriage.model.DeviceToken;
import com.vettriage.repository.DeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeviceTokenService {

    private final DeviceTokenRepository deviceTokenRepository;

    @Transactional
    public void registerOrUpdate(String fcmToken, String clinicCode, String deviceName) {
        DeviceToken token = deviceTokenRepository.findByFcmToken(fcmToken)
                .orElseGet(() -> DeviceToken.builder()
                        .fcmToken(fcmToken)
                        .build());
        token.setClinicCode(clinicCode);
        token.setDeviceName(deviceName);
        deviceTokenRepository.save(token);
    }

    @Transactional(readOnly = true)
    public List<String> getApprovedFcmTokens(String clinicCode) {
        return deviceTokenRepository.findByClinicCodeAndApproved(clinicCode, true)
                .stream()
                .map(DeviceToken::getFcmToken)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DeviceTokenResponse> getDevicesForClinic(String clinicCode) {
        return deviceTokenRepository.findByClinicCode(clinicCode)
                .stream()
                .map(d -> new DeviceTokenResponse(
                        d.getId(), d.getDeviceName(), d.getLastSeen(), d.isApproved()))
                .toList();
    }

    @Transactional
    public void deleteDevice(UUID id) {
        if (!deviceTokenRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Device not found");
        }
        deviceTokenRepository.deleteById(id);
    }
}
