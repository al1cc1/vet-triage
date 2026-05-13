package com.vettriage.dto.device;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
public class DeviceTokenResponse {
    private UUID id;
    private String deviceName;
    private LocalDateTime lastSeen;
    private boolean approved;
}
