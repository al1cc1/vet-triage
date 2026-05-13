package com.vettriage.repository;

import com.vettriage.model.Role;
import com.vettriage.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailAndClinicId(String email, UUID clinicId);
    List<User> findByClinicIdAndRole(UUID clinicId, Role role);
    boolean existsByEmailAndClinicId(String email, UUID clinicId);
    void deleteAllByClinicId(UUID clinicId);
}
