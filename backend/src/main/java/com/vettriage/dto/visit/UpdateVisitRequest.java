package com.vettriage.dto.visit;

import com.vettriage.model.TriageCategory;
import com.vettriage.model.VisitStatus;
import lombok.Data;

@Data
public class UpdateVisitRequest {
    private TriageCategory triageCategory;
    private Integer waitingMinutes;
    private VisitStatus status;
    private String reason;
}
