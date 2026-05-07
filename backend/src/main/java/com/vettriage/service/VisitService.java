package com.vettriage.service;

import com.vettriage.algorithm.TriageAlgorithm;
import com.vettriage.dto.visit.CreateVisitRequest;
import com.vettriage.dto.visit.UpdateVisitRequest;
import com.vettriage.dto.visit.VisitResponse;
import com.vettriage.model.*;
import com.vettriage.repository.ClinicRepository;
import com.vettriage.repository.OwnerRepository;
import com.vettriage.repository.VisitRepository;
import com.vettriage.repository.VisitSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VisitService {

    private final VisitRepository visitRepository;
    private final ClinicRepository clinicRepository;
    private final OwnerRepository ownerRepository;
    private final TriageAlgorithm triageAlgorithm;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public VisitResponse createVisit(CreateVisitRequest req, UUID clinicId) {
        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinic not found"));

        Owner owner = ownerRepository.save(Owner.builder()
                .fullName(req.getOwnerFullName())
                .address(req.getOwnerAddress())
                .phone(req.getOwnerPhone())
                .build());

        Animal animal = Animal.builder()
                .name(req.getAnimalName())
                .species(req.getSpecies())
                .breed(req.getBreed())
                .gender(req.getGender())
                .ageYears(req.getAgeYears())
                .color(req.getColor())
                .weightKg(req.getWeightKg())
                .build();

        List<String> inputs = new ArrayList<>();
        if (req.getSymptoms() != null) inputs.addAll(req.getSymptoms());
        if (req.getReason() != null) inputs.add(req.getReason());

        TriageCategory category = req.getManualTriageCategory() != null
                ? req.getManualTriageCategory()
                : triageAlgorithm.calculateCategory(inputs);

        int waitingMinutes;
        if (req.getManualWaitingMinutes() != null && req.getManualWaitingMinutes() > 0) {
            waitingMinutes = req.getManualWaitingMinutes();
        } else {
            waitingMinutes = triageAlgorithm.calculateWaitingTime(category, LocalDateTime.now());
        }

        Visit visit = visitRepository.save(Visit.builder()
                .clinic(clinic)
                .animal(animal)
                .owner(owner)
                .reason(req.getReason())
                .triageCategory(category)
                .waitingMinutes(waitingMinutes)
                .status(VisitStatus.WAITING)
                .build());

        broadcastQueue(clinic.getClinicCode());
        return toResponse(visit);
    }

    @Transactional
    public VisitResponse updateVisit(UUID visitId, UUID clinicId, UpdateVisitRequest req) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Visit not found"));
        if (!visit.getClinic().getId().equals(clinicId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");

        if (req.getTriageCategory() != null) visit.setTriageCategory(req.getTriageCategory());
        if (req.getWaitingMinutes() != null)  visit.setWaitingMinutes(req.getWaitingMinutes());
        if (req.getStatus() != null)          visit.setStatus(req.getStatus());
        if (req.getReason() != null && !req.getReason().isBlank()) visit.setReason(req.getReason());

        visit = visitRepository.save(visit);
        broadcastQueue(visit.getClinic().getClinicCode());
        return toResponse(visit);
    }

    @Transactional
    public void removeVisit(UUID visitId, UUID clinicId) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Visit not found"));

        if (!visit.getClinic().getId().equals(clinicId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");

        String clinicCode = visit.getClinic().getClinicCode();
        visitRepository.delete(visit);
        visitRepository.flush();
        broadcastQueue(clinicCode);
    }

    @Transactional(readOnly = true)
    public List<VisitResponse> getActiveQueue(String clinicCode) {
        Clinic clinic = clinicRepository.findByClinicCode(clinicCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinic not found"));

        return visitRepository.findByClinicIdAndStatus(clinic.getId(), VisitStatus.WAITING)
                .stream()
                .sorted(Comparator
                        .comparingInt((Visit v) -> v.getTriageCategory().ordinal())
                        .thenComparing(Visit::getCreatedAt))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VisitResponse> getAllVisits(String clinicCode) {
        Clinic clinic = clinicRepository.findByClinicCode(clinicCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinic not found"));
        return visitRepository.findByClinicIdOrderByCreatedAtDesc(clinic.getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<VisitResponse> getFilteredHistory(UUID clinicId, LocalDate dateFrom, LocalDate dateTo,
                                                   List<TriageCategory> categories, String species,
                                                   VisitStatus status, String search) {
        var spec = VisitSpecification.build(clinicId, dateFrom, dateTo, categories, species, status, search);
        return visitRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public VisitResponse acceptVisit(UUID visitId, UUID clinicId) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Visit not found"));
        if (!visit.getClinic().getId().equals(clinicId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        visit.setStatus(VisitStatus.DONE);
        visit = visitRepository.save(visit);
        broadcastQueue(visit.getClinic().getClinicCode());
        return toResponse(visit);
    }

    private void broadcastQueue(String clinicCode) {
        List<VisitResponse> queue = getActiveQueue(clinicCode);
        messagingTemplate.convertAndSend("/topic/queue/" + clinicCode, queue);
    }

    private VisitResponse toResponse(Visit v) {
        Animal a = v.getAnimal();
        Owner o = v.getOwner();
        return VisitResponse.builder()
                .id(v.getId())
                .createdAt(v.getCreatedAt())
                .reason(v.getReason())
                .triageCategory(v.getTriageCategory())
                .waitingMinutes(v.getWaitingMinutes())
                .status(v.getStatus())
                .animalName(a.getName())
                .species(a.getSpecies())
                .breed(a.getBreed())
                .gender(a.getGender())
                .ageYears(a.getAgeYears())
                .color(a.getColor())
                .weightKg(a.getWeightKg())
                .ownerFullName(o.getFullName())
                .ownerPhone(o.getPhone())
                .build();
    }
}
