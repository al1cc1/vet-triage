package com.vettriage.security;

public record ClaimsPrincipal(String email, String clinicId, String role) {}
