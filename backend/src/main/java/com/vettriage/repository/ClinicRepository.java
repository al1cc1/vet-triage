package com.vettriage.repository;

import com.vettriage.model.Clinic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClinicRepository extends JpaRepository<Clinic, UUID> {
    Optional<Clinic> findByEmail(String email);
    Optional<Clinic> findByClinicCode(String clinicCode);
    boolean existsByEmail(String email);
    boolean existsByClinicCode(String clinicCode);
    Optional<Clinic> findByVerificationToken(String verificationToken);
    Optional<Clinic> findByResetToken(String resetToken);
}
