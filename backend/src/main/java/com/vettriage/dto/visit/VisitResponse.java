package com.vettriage.dto.visit;

import com.vettriage.model.Gender;
import com.vettriage.model.TriageCategory;
import com.vettriage.model.VisitStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class VisitResponse {
    private UUID id;
    private LocalDateTime createdAt;
    private String reason;
    private TriageCategory triageCategory;
    private Integer waitingMinutes;
    private VisitStatus status;

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
    private String ownerPhone;
}
