package com.vettriage.dto.clinic;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ClinicSettingsResponse {
    private String accentColor;
    private String language;
    private String clinicCode;
    private String name;
    private String mobilePin;
    private boolean notifyRed;
    private boolean notifyOrange;
    private LocalDateTime createdAt;
    private long totalVisits;
}
