package com.vettriage.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:5174}")
    private String frontendUrl;

    @Value("${server.port:8080}")
    private String serverPort;

    public void sendVerificationEmail(String toEmail, String clinicName, String token) {
        String url = "http://localhost:" + serverPort + "/api/auth/verify?token=" + token;
        send(toEmail, "VetTriage – potwierdź adres email", buildVerificationHtml(clinicName, url));
    }

    public void sendPasswordResetEmail(String toEmail, String clinicName, String token) {
        String url = frontendUrl + "/reset-password?token=" + token;
        send(toEmail, "VetTriage – resetowanie hasła", buildResetHtml(clinicName, url));
    }

    private void send(String toEmail, String subject, String html) {
        if (mailSender == null || fromEmail.isBlank()) {
            log.warn("Mail not configured — skipping email to {}", toEmail);
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
            h.setTo(toEmail);
            h.setFrom(fromEmail);
            h.setSubject(subject);
            h.setText(html, true);
            mailSender.send(msg);
            log.info("Email '{}' sent to {}", subject, toEmail);
        } catch (Exception e) {
            log.warn("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildVerificationHtml(String clinicName, String url) {
        return wrapInLayout("Potwierdź adres email",
            String.format("""
                <p style="margin:0 0 12px;color:#475569;font-size:15px;line-height:1.7">
                  Witaj! Klinika <strong style="color:#0f172a">%s</strong> została pomyślnie zarejestrowana w systemie VetTriage.
                </p>
                <p style="margin:0 0 32px;color:#475569;font-size:15px;line-height:1.7">
                  Kliknij poniższy przycisk, aby potwierdzić swój adres email i aktywować konto.
                </p>
                %s
                <p style="margin:28px 0 0;color:#94a3b8;font-size:13px;line-height:1.6">
                  Jeśli link nie działa, skopiuj i wklej ten adres w przeglądarce:<br>
                  <a href="%s" style="color:#22c55e;word-break:break-all">%s</a>
                </p>
                <p style="margin:16px 0 0;color:#cbd5e1;font-size:12px">
                  Jeśli nie zakładałeś konta w VetTriage, zignoruj tę wiadomość.
                </p>
                """,
                clinicName,
                button(url, "Potwierdź email"),
                url, url
            )
        );
    }

    private String buildResetHtml(String clinicName, String url) {
        return wrapInLayout("Resetowanie hasła",
            String.format("""
                <p style="margin:0 0 12px;color:#475569;font-size:15px;line-height:1.7">
                  Witaj! Otrzymaliśmy prośbę o zresetowanie hasła dla kliniki <strong style="color:#0f172a">%s</strong>.
                </p>
                <p style="margin:0 0 32px;color:#475569;font-size:15px;line-height:1.7">
                  Kliknij poniższy przycisk, aby ustawić nowe hasło. Link jest ważny przez <strong>1 godzinę</strong>.
                </p>
                %s
                <p style="margin:28px 0 0;color:#94a3b8;font-size:13px;line-height:1.6">
                  Jeśli link nie działa, skopiuj i wklej ten adres w przeglądarce:<br>
                  <a href="%s" style="color:#22c55e;word-break:break-all">%s</a>
                </p>
                <p style="margin:16px 0 0;color:#cbd5e1;font-size:12px">
                  Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.
                </p>
                """,
                clinicName,
                button(url, "Ustaw nowe hasło"),
                url, url
            )
        );
    }

    private String button(String url, String label) {
        return String.format("""
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:8px;background:#22c55e">
                  <a href="%s" style="display:inline-block;padding:14px 36px;color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:8px">
                    %s
                  </a>
                </td>
              </tr>
            </table>
            """, url, label);
    }

    private String wrapInLayout(String title, String body) {
        return String.format("""
            <!DOCTYPE html>
            <html lang="pl">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0"
                    style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);max-width:560px">
                    <tr>
                      <td style="background:#22c55e;padding:32px 40px;text-align:center">
                        <div style="font-size:40px">&#x1F43E;</div>
                        <div style="font-size:24px;font-weight:800;color:#fff;margin-top:6px">VetTriage</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px 40px 32px">
                        <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a">%s</h1>
                        %s
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0">
                        <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center">
                          &copy; 2026 VetTriage &middot; Oprogramowanie dla klinik weterynaryjnych
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """, title, body);
    }
}
