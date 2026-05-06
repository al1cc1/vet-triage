package com.vettriage.repository;

import com.vettriage.model.Animal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AnimalRepository extends JpaRepository<Animal, UUID> {
}
