package com.vettriage.repository;

import com.vettriage.model.Owner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OwnerRepository extends JpaRepository<Owner, UUID> {
    List<Owner> findByPhoneContaining(String phone);
    List<Owner> findByFullNameContainingIgnoreCase(String fullName);
}
