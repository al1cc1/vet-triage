package com.vettriage.repository;

import com.vettriage.model.TriageCategory;
import com.vettriage.model.Visit;
import com.vettriage.model.VisitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface VisitRepository extends JpaRepository<Visit, UUID>, JpaSpecificationExecutor<Visit> {
    List<Visit> findByClinicIdOrderByCreatedAtDesc(UUID clinicId);
    List<Visit> findByClinicIdAndStatus(UUID clinicId, VisitStatus status);
    List<Visit> findByClinicIdAndCreatedAtBetween(UUID clinicId, LocalDateTime from, LocalDateTime to);
    long countByClinicIdAndStatusAndTriageCategory(UUID clinicId, VisitStatus status, TriageCategory category);
    long countByClinicId(UUID clinicId);
    void deleteAllByClinicId(UUID clinicId);
}
