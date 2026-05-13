package com.vettriage.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SessionResponse {
    private String clinicId;
    private String clinicCode;
}
