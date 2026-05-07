package com.vettriage.controller;

import com.vettriage.dto.visit.VisitResponse;
import com.vettriage.model.Clinic;
import com.vettriage.repository.ClinicRepository;
import com.vettriage.service.VisitService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Tag(name = "Publiczne", description = "Endpointy publiczne: kolejka i ustawienia kliniki")
public class PublicController {

    private final VisitService visitService;
    private final ClinicRepository clinicRepository;

    @GetMapping("/queue/{clinicCode}")
    public List<VisitResponse> getQueue(@PathVariable String clinicCode) {
        return visitService.getActiveQueue(clinicCode);
    }

    @GetMapping("/clinic/{clinicCode}")
    public Map<String, String> getClinicInfo(@PathVariable String clinicCode) {
        Clinic clinic = clinicRepository.findByClinicCode(clinicCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinic not found"));
        return Map.of("name", clinic.getName(), "clinicCode", clinicCode);
    }

    @GetMapping("/clinic/{clinicCode}/settings")
    public Map<String, String> getClinicSettings(@PathVariable String clinicCode) {
        Clinic clinic = clinicRepository.findByClinicCode(clinicCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinic not found"));
        return Map.of(
            "name", clinic.getName(),
            "clinicCode", clinicCode,
            "accentColor", clinic.getAccentColor(),
            "language", clinic.getLanguage()
        );
    }
}
