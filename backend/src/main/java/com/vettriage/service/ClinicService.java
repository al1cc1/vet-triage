package com.vettriage.service;

import com.vettriage.dto.clinic.ClinicSettingsResponse;
import com.vettriage.dto.clinic.UpdateClinicSettingsRequest;
import com.vettriage.model.Clinic;
import com.vettriage.repository.ClinicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClinicService {

    private final ClinicRepository clinicRepository;

    public ClinicSettingsResponse getSettings(UUID clinicId) {
        return toResponse(findOrThrow(clinicId));
    }

    @Transactional
    public ClinicSettingsResponse updateSettings(UUID clinicId, UpdateClinicSettingsRequest req) {
        Clinic clinic = findOrThrow(clinicId);
        if (req.getAccentColor() != null) clinic.setAccentColor(req.getAccentColor());
        if (req.getLanguage() != null)    clinic.setLanguage(req.getLanguage());
        return toResponse(clinicRepository.save(clinic));
    }

    private Clinic findOrThrow(UUID id) {
        return clinicRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinic not found"));
    }

    private ClinicSettingsResponse toResponse(Clinic c) {
        return new ClinicSettingsResponse(c.getAccentColor(), c.getLanguage(), c.getClinicCode(), c.getName());
    }
}
