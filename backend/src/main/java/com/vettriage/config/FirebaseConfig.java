package com.vettriage.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.service-account-path}")
    private String serviceAccountPath;

    @PostConstruct
    public void init() {
        if (!FirebaseApp.getApps().isEmpty()) return;

        try {
            InputStream is = resolveCredentials();
            if (is == null) {
                log.warn("Firebase service account not available — Firebase Auth disabled.");
                return;
            }
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(is))
                    .build();
            FirebaseApp.initializeApp(options);
            log.info("Firebase Admin SDK initialized.");
        } catch (Exception e) {
            log.warn("Firebase Admin SDK init failed: {}", e.getMessage());
        }
    }

    private InputStream resolveCredentials() throws Exception {
        String json = System.getenv("FIREBASE_SERVICE_ACCOUNT_JSON");
        if (json != null && !json.isBlank()) {
            log.info("Firebase: loading credentials from FIREBASE_SERVICE_ACCOUNT_JSON env var.");
            return new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8));
        }
        File file = new File(serviceAccountPath);
        if (file.exists()) {
            log.info("Firebase: loading credentials from file '{}'.", serviceAccountPath);
            return new FileInputStream(file);
        }
        return null;
    }
}
