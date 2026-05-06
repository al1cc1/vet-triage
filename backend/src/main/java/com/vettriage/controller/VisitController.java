package com.vettriage.controller;

import com.vettriage.algorithm.TriageAlgorithm;
import com.vettriage.dto.visit.CreateVisitRequest;
import com.vettriage.dto.visit.VisitResponse;
import com.vettriage.model.TriageCategory;
import com.vettriage.model.VisitStatus;
import com.vettriage.security.ClaimsPrincipal;
import com.vettriage.service.VisitService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/visits")
@RequiredArgsConstructor
public class VisitController {

    private final VisitService visitService;
    private final TriageAlgorithm triageAlgorithm;

    @PostMapping
    public ResponseEntity<VisitResponse> createVisit(@RequestBody CreateVisitRequest request,
                                                      Authentication auth) {
        UUID clinicId = UUID.fromString(principal(auth).clinicId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(visitService.createVisit(request, clinicId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeVisit(@PathVariable UUID id, Authentication auth) {
        UUID clinicId = UUID.fromString(principal(auth).clinicId());
        visitService.removeVisit(id, clinicId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/queue/{clinicCode}")
    public ResponseEntity<List<VisitResponse>> getQueue(@PathVariable String clinicCode) {
        return ResponseEntity.ok(visitService.getActiveQueue(clinicCode));
    }

    @GetMapping("/history/{clinicCode}")
    public ResponseEntity<List<VisitResponse>> getHistory(@PathVariable String clinicCode) {
        return ResponseEntity.ok(visitService.getAllVisits(clinicCode));
    }

    @GetMapping("/history")
    public ResponseEntity<List<VisitResponse>> getFilteredHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) List<TriageCategory> category,
            @RequestParam(required = false) String species,
            @RequestParam(required = false) VisitStatus status,
            Authentication auth) {
        UUID clinicId = UUID.fromString(principal(auth).clinicId());
        return ResponseEntity.ok(visitService.getFilteredHistory(clinicId, dateFrom, dateTo, category, species, status));
    }

    @GetMapping("/preview-time/{category}")
    public ResponseEntity<Map<String, Object>> previewTime(@PathVariable TriageCategory category) {
        int minutes = triageAlgorithm.calculateWaitingTime(category, LocalDateTime.now());
        return ResponseEntity.ok(Map.of("category", category.name(), "waitingMinutes", minutes));
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<VisitResponse> acceptVisit(@PathVariable UUID id, Authentication auth) {
        UUID clinicId = UUID.fromString(principal(auth).clinicId());
        return ResponseEntity.ok(visitService.acceptVisit(id, clinicId));
    }

    private ClaimsPrincipal principal(Authentication auth) {
        return (ClaimsPrincipal) auth.getPrincipal();
    }
}
