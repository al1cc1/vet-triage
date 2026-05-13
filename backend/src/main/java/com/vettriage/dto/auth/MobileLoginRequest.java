package com.vettriage.dto.auth;

import lombok.Data;

@Data
public class MobileLoginRequest {
    private String clinicCode;
    private String clinicPin;
}
