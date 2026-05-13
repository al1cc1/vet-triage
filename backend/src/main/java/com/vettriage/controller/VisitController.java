package com.vettriage.controller;

import com.vettriage.algorithm.TriageAlgorithm;
import com.vettriage.dto.visit.CreateVisitRequest;
import com.vettriage.dto.visit.UpdateVisitRequest;
import com.vettriage.dto.visit.VisitResponse;
import com.vettriage.model.TriageCategory;
import com.vettriage.model.VisitStatus;
import com.vettriage.security.ClaimsPrincipal;
import com.vettriage.service.VisitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@Tag(name = "Wizyty", description = "Zarządzanie wizytami i kolejką triażu")
public class VisitController {

    private final VisitService visitService;
    private final TriageAlgorithm triageAlgorithm;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Utwórz nową wizytę")
    public ResponseEntity<VisitResponse> createVisit(@RequestBody CreateVisitRequest request,
                                                      Authentication auth) {
        UUID clinicId = UUID.fromString(principal(auth).clinicId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(visitService.createVisit(request, clinicId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Edytuj wizytę (kategoria, czas, status, powód)")
    public ResponseEntity<VisitResponse> updateVisit(@PathVariable UUID id,
                                                      @RequestBody UpdateVisitRequest request,
                                                      Authentication auth) {
        UUID clinicId = UUID.fromString(principal(auth).clinicId());
        return ResponseEntity.ok(visitService.updateVisit(id, clinicId, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Usuń wizytę")
    public ResponseEntity<Void> removeVisit(@PathVariable UUID id, Authentication auth) {
        UUID clinicId = UUID.fromString(principal(auth).clinicId());
        visitService.removeVisit(id, clinicId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/queue/{clinicCode}")
    @Operation(summary = "Pobierz aktywną kolejkę triażu")
    public ResponseEntity<List<VisitResponse>> getQueue(@PathVariable String clinicCode) {
        return ResponseEntity.ok(visitService.getActiveQueue(clinicCode));
    }

    @GetMapping("/history/{clinicCode}")
    @Operation(summary = "Historia wizyt (legacy)")
    public ResponseEntity<List<VisitResponse>> getHistory(@PathVariable String clinicCode) {
        return ResponseEntity.ok(visitService.getAllVisits(clinicCode));
    }

    @GetMapping("/history")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Filtrowana historia wizyt")
    public ResponseEntity<List<VisitResponse>> getFilteredHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) List<TriageCategory> category,
            @RequestParam(required = false) String species,
            @RequestParam(required = false) VisitStatus status,
            @RequestParam(required = false) String search,
            Authentication auth) {
        UUID clinicId = UUID.fromString(principal(auth).clinicId());
        return ResponseEntity.ok(visitService.getFilteredHistory(clinicId, dateFrom, dateTo, category, species, status, search));
    }

    @GetMapping("/preview-time/{category}")
    @Operation(summary = "Podgląd szacowanego czasu oczekiwania")
    public ResponseEntity<Map<String, Object>> previewTime(@PathVariable TriageCategory category) {
        int minutes = triageAlgorithm.calculateWaitingTime(category, LocalDateTime.now());
        return ResponseEntity.ok(Map.of("category", category.name(), "waitingMinutes", minutes));
    }

    @PatchMapping("/{id}/accept")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Oznacz wizytę jako przyjętą")
    public ResponseEntity<VisitResponse> acceptVisit(@PathVariable UUID id, Authentication auth) {
        UUID clinicId = UUID.fromString(principal(auth).clinicId());
        return ResponseEntity.ok(visitService.acceptVisit(id, clinicId));
    }

    private ClaimsPrincipal principal(Authentication auth) {
        return (ClaimsPrincipal) auth.getPrincipal();
    }
}
