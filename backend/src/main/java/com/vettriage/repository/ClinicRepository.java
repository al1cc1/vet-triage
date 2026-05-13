package com.vettriage.repository;

import com.vettriage.model.Clinic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClinicRepository extends JpaRepository<Clinic, UUID> {
    Optional<Clinic> findByFirebaseUid(String firebaseUid);
    boolean existsByFirebaseUid(String firebaseUid);
    Optional<Clinic> findByClinicCode(String clinicCode);
    boolean existsByClinicCode(String clinicCode);
}
