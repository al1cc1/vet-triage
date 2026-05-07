package com.vettriage.dto.auth;

public record RegisterResponse(
        boolean autoLogin,
        String message,
        String token,
        String role,
        String clinicCode,
        String clinicId
) {}
