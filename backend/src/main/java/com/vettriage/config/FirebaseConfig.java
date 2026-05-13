package com.vettriage.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileInputStream;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.service-account-path}")
    private String serviceAccountPath;

    @PostConstruct
    public void init() {
        if (!FirebaseApp.getApps().isEmpty()) return;
        File file = new File(serviceAccountPath);
        if (!file.exists()) {
            log.warn("Firebase service account not found at '{}' — Firebase Auth disabled.", serviceAccountPath);
            return;
        }
        try (FileInputStream is = new FileInputStream(file)) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(is))
                    .build();
            FirebaseApp.initializeApp(options);
            log.info("Firebase Admin SDK initialized from '{}'", serviceAccountPath);
        } catch (Exception e) {
            log.warn("Firebase Admin SDK init failed: {}", e.getMessage());
        }
    }
}
