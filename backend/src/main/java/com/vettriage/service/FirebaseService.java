package com.vettriage.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
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
        File file = new File(serviceAccountPath);
        if (!file.exists()) {
            log.warn("Firebase service account not found at '{}'. Push notifications disabled.", serviceAccountPath);
            return;
        }
        try (FileInputStream is = new FileInputStream(file)) {
            credentials = GoogleCredentials.fromStream(is)
                    .createScoped("https://www.googleapis.com/auth/firebase.messaging");
            log.info("Firebase initialized from '{}'", serviceAccountPath);
        } catch (Exception e) {
            log.warn("Firebase init failed: {}. Push notifications disabled.", e.getMessage());
        }
    }

    public void sendPushNotification(List<String> fcmTokens, String title, String body) {
        if (credentials == null || fcmTokens.isEmpty()) return;
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
            if (response.statusCode() != 200) {
                String tokenPreview = fcmToken.length() > 12
                        ? "..." + fcmToken.substring(fcmToken.length() - 8)
                        : fcmToken;
                log.warn("FCM push failed for token {}: {}", tokenPreview, response.body());
            }
        } catch (Exception e) {
            log.warn("Error sending FCM push: {}", e.getMessage());
        }
    }
}
