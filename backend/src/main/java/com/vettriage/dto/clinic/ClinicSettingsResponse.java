package com.vettriage.dto.clinic;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ClinicSettingsResponse {
    private String accentColor;
    private String language;
    private String clinicCode;
    private String name;
}
