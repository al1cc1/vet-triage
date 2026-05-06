package com.vettriage.dto.visit;

import com.vettriage.model.Gender;
import com.vettriage.model.TriageCategory;
import lombok.Data;

import java.util.List;

@Data
public class CreateVisitRequest {
    // Animal
    private String animalName;
    private String species;
    private String breed;
    private Gender gender;
    private Integer ageYears;
    private String color;
    private Double weightKg;

    // Owner
    private String ownerFullName;
    private String ownerAddress;
    private String ownerPhone;

    // Visit
    private String reason;
    private List<String> symptoms;

    // Manual override (optional)
    private TriageCategory manualTriageCategory;
    private Integer manualWaitingMinutes;
}
