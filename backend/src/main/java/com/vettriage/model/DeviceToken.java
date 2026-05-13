package com.vettriage.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "device_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 16)
    private String clinicCode;

    @Column(nullable = false, unique = true, length = 512)
    private String fcmToken;

    @Column(length = 100)
    private String deviceName;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime lastSeen;

    @Builder.Default
    @Column(nullable = false)
    private boolean approved = true;
}
