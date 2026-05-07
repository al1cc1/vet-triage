package com.vettriage.dto.auth;

import lombok.Data;

@Data
public class ResendVerificationRequest {
    private String email;
}
