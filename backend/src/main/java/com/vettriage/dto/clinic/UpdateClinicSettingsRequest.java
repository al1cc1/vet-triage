package com.vettriage.dto.clinic;

import lombok.Data;

@Data
public class UpdateClinicSettingsRequest {
    private String name;
    private String accentColor;
    private String language;
    private String mobilePin;
    private Boolean notifyRed;
    private Boolean notifyOrange;
}
