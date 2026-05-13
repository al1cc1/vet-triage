package com.vettriage.repository;

import com.vettriage.model.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, UUID> {
    Optional<DeviceToken> findByFcmToken(String fcmToken);
    List<DeviceToken> findByClinicCode(String clinicCode);
    List<DeviceToken> findByClinicCodeAndApproved(String clinicCode, boolean approved);
    void deleteAllByClinicCode(String clinicCode);
}
