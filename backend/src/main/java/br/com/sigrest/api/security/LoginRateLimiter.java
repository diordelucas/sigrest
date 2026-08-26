package br.com.sigrest.api.security;

import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Bloqueio temporario de tentativas de login por IP + email, em memoria.
 * Instalacao de instancia unica, sem necessidade de contador compartilhado.
 */
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration BLOCK_WINDOW = Duration.ofMinutes(5);
    private static final Duration IDLE_CLEANUP_AFTER = Duration.ofHours(1);

    private final Map<String, State> attemptsByKey = new ConcurrentHashMap<>();

    private static final class State {
        int count;
        Instant blockedUntil;
        Instant lastSeen = Instant.now();
    }

    public String key(String ip, String email) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        return ip + "|" + normalizedEmail;
    }

    public void checkBlocked(String key) {
        State state = attemptsByKey.get(key);
        if (state == null || state.blockedUntil == null) {
            return;
        }
        Instant now = Instant.now();
        if (now.isBefore(state.blockedUntil)) {
            long minutes = Math.max(1, Duration.between(now, state.blockedUntil).toMinutes() + 1);
            throw new BusinessException(
                    ErrorCode.AUTH_MUITAS_TENTATIVAS,
                    "Muitas tentativas de login. Tente novamente em cerca de " + minutes + " minuto(s).");
        }
    }

    public void registerFailure(String key) {
        attemptsByKey.compute(key, (k, current) -> {
            State state = current != null ? current : new State();
            if (state.blockedUntil != null && !Instant.now().isBefore(state.blockedUntil)) {
                state.count = 0;
                state.blockedUntil = null;
            }
            state.count++;
            state.lastSeen = Instant.now();
            if (state.count >= MAX_ATTEMPTS) {
                state.blockedUntil = Instant.now().plus(BLOCK_WINDOW);
            }
            return state;
        });
    }

    public void registerSuccess(String key) {
        attemptsByKey.remove(key);
    }

    /** Evita crescimento sem limite do mapa com logins que nunca mais tentaram de novo. */
    @Scheduled(fixedRate = 30, timeUnit = TimeUnit.MINUTES)
    void cleanupIdleEntries() {
        Instant threshold = Instant.now().minus(IDLE_CLEANUP_AFTER);
        attemptsByKey.values().removeIf(state -> state.lastSeen.isBefore(threshold));
    }
}
