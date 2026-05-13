package com.vettriage.dto.device;

import lombok.Data;

@Data
public class DeviceRegisterRequest {
    private String fcmToken;
    private String clinicCode;
    private String deviceName;
}
