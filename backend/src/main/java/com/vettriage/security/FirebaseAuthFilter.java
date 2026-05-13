package com.vettriage.security;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.vettriage.repository.ClinicRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class FirebaseAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final ClinicRepository clinicRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String token = extractToken(request);

        if (token != null) {
            boolean authed = tryFirebaseAuth(token, request, response);
            if (response.isCommitted()) return; // clinic_not_found response already written
            if (!authed) tryJwtAuth(token);
        }

        chain.doFilter(request, response);
    }

    private boolean tryFirebaseAuth(String token,
                                    HttpServletRequest request,
                                    HttpServletResponse response) throws IOException {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                log.warn("FirebaseAuthFilter: Firebase Admin SDK not initialized — skipping token verification");
                return false;
            }
            FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(token);
            String uid = decoded.getUid();
            log.debug("FirebaseAuthFilter: token verified, uid={}", uid);

            var clinicOpt = clinicRepository.findByFirebaseUid(uid);
            if (clinicOpt.isPresent()) {
                var clinic = clinicOpt.get();
                log.debug("FirebaseAuthFilter: clinic found, clinicId={}", clinic.getId());
                var principal = new ClaimsPrincipal(decoded.getEmail(), clinic.getId().toString(), "RECEPTION");
                var auth = new UsernamePasswordAuthenticationToken(
                        principal, null, List.of(new SimpleGrantedAuthority("ROLE_RECEPTION")));
                SecurityContextHolder.getContext().setAuthentication(auth);
                return true;
            }

            log.warn("FirebaseAuthFilter: no clinic found for Firebase uid={}", uid);

            // Registration endpoint must be allowed through so the clinic can be created
            boolean isRegisterRequest = "POST".equalsIgnoreCase(request.getMethod())
                    && "/api/auth/register".equals(request.getRequestURI());
            if (isRegisterRequest) {
                return false;
            }

            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":\"clinic_not_found\"}");
            return false;

        } catch (Exception e) {
            log.error("FirebaseAuthFilter: token verification failed — {}", e.getMessage());
            return false;
        }
    }

    private void tryJwtAuth(String token) {
        if (jwtUtil.isTokenValid(token)) {
            ClaimsPrincipal principal = jwtUtil.extractPrincipal(token);
            var authority = new SimpleGrantedAuthority("ROLE_" + principal.role());
            var auth = new UsernamePasswordAuthenticationToken(principal, null, List.of(authority));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
