package com.vettriage.service;

import com.vettriage.dto.clinic.ClinicSettingsResponse;
import com.vettriage.dto.clinic.UpdateClinicSettingsRequest;
import com.vettriage.model.Clinic;
import com.vettriage.repository.ClinicRepository;
import com.vettriage.repository.DeviceTokenRepository;
import com.vettriage.repository.UserRepository;
import com.vettriage.repository.VisitRepository;
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
    private final VisitRepository visitRepository;
    private final UserRepository userRepository;
    private final DeviceTokenRepository deviceTokenRepository;

    public ClinicSettingsResponse getSettings(UUID clinicId) {
        return toResponse(findOrThrow(clinicId));
    }

    @Transactional
    public ClinicSettingsResponse updateSettings(UUID clinicId, UpdateClinicSettingsRequest req) {
        Clinic clinic = findOrThrow(clinicId);
        if (req.getName() != null && !req.getName().isBlank()) clinic.setName(req.getName().trim());
        if (req.getAccentColor() != null) clinic.setAccentColor(req.getAccentColor());
        if (req.getLanguage() != null)    clinic.setLanguage(req.getLanguage());
        if (req.getMobilePin() != null) {
            String pin = req.getMobilePin().trim();
            if (pin.isEmpty()) {
                clinic.setMobilePin(null);
            } else if (pin.matches("\\d{4,6}")) {
                clinic.setMobilePin(pin);
            }
        }
        if (req.getNotifyRed() != null)    clinic.setNotifyRed(req.getNotifyRed());
        if (req.getNotifyOrange() != null) clinic.setNotifyOrange(req.getNotifyOrange());
        return toResponse(clinicRepository.save(clinic));
    }

    @Transactional
    public void deleteClinic(UUID clinicId) {
        Clinic clinic = findOrThrow(clinicId);
        visitRepository.deleteAllByClinicId(clinicId);
        deviceTokenRepository.deleteAllByClinicCode(clinic.getClinicCode());
        userRepository.deleteAllByClinicId(clinicId);
        clinicRepository.delete(clinic);
    }

    private Clinic findOrThrow(UUID id) {
        return clinicRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinic not found"));
    }

    private ClinicSettingsResponse toResponse(Clinic c) {
        long total = visitRepository.countByClinicId(c.getId());
        return new ClinicSettingsResponse(
                c.getAccentColor(), c.getLanguage(), c.getClinicCode(), c.getName(), c.getMobilePin(),
                c.isNotifyRed(), c.isNotifyOrange(), c.getCreatedAt(), total);
    }
}
