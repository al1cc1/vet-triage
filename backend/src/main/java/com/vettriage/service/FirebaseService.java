package com.vettriage.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class FirebaseService {

    @Value("${firebase.project-id}")
    private String projectId;

    @Value("${firebase.service-account-path}")
    private String serviceAccountPath;

    private GoogleCredentials credentials;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @PostConstruct
    public void init() {
        try {
            InputStream is = resolveCredentials();
            if (is == null) {
                log.warn("FirebaseService: no credentials available — push notifications disabled.");
                return;
            }
            credentials = GoogleCredentials.fromStream(is)
                    .createScoped("https://www.googleapis.com/auth/firebase.messaging");
            log.info("FirebaseService: FCM credentials loaded, push notifications enabled.");
        } catch (Exception e) {
            log.warn("FirebaseService: init failed — {}. Push notifications disabled.", e.getMessage());
        }
    }

    private InputStream resolveCredentials() throws Exception {
        String json = System.getenv("FIREBASE_SERVICE_ACCOUNT_JSON");
        if (json != null && !json.isBlank()) {
            log.info("FirebaseService: loading credentials from FIREBASE_SERVICE_ACCOUNT_JSON env var.");
            return new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8));
        }
        File file = new File(serviceAccountPath);
        if (file.exists()) {
            log.info("FirebaseService: loading credentials from file '{}'.", serviceAccountPath);
            return new FileInputStream(file);
        }
        return null;
    }

    public void sendPushNotification(List<String> fcmTokens, String title, String body) {
        if (credentials == null) {
            log.warn("FirebaseService.sendPushNotification: credentials not initialized, skipping.");
            return;
        }
        if (fcmTokens.isEmpty()) return;
        try {
            credentials.refreshIfExpired();
            String accessToken = credentials.getAccessToken().getTokenValue();
            String url = "https://fcm.googleapis.com/v1/projects/" + projectId + "/messages:send";
            for (String token : fcmTokens) {
                sendToToken(url, accessToken, token, title, body);
            }
        } catch (Exception e) {
            log.warn("Failed to obtain FCM access token: {}", e.getMessage());
        }
    }

    private void sendToToken(String url, String accessToken,
                              String fcmToken, String title, String body) {
        try {
            String tokenPreview = fcmToken.length() > 20 ? fcmToken.substring(0, 20) + "..." : fcmToken;
            log.info("Sending FCM to token: {}...", tokenPreview);

            Map<String, Object> notification = Map.of("title", title, "body", body);
            Map<String, Object> message = Map.of("token", fcmToken, "notification", notification);
            Map<String, Object> payload = Map.of("message", message);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("FCM response: status={}, body={}", response.statusCode(), response.body());
            if (response.statusCode() != 200) {
                log.warn("FCM push failed for token {}: HTTP {}", tokenPreview, response.statusCode());
            }
        } catch (Exception e) {
            log.warn("Error sending FCM push: {}", e.getMessage());
        }
    }
}
