package com.vettriage.dto.auth;

import lombok.Data;

@Data
public class DoctorLoginRequest {
    private String clinicCode;
    private String doctorPin;
}
