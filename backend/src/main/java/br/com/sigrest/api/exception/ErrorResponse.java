package br.com.sigrest.api.exception;

import java.time.LocalDateTime;

/**
 * Payload padrão de erro devolvido ao frontend.
 *
 * <p>{@code codigo} identifica o erro de forma estável (ex. {@code SIGREST-PROD-001}) e é o que
 * o suporte usa para localizar a causa raiz; {@code message} é o texto direto mostrado ao usuário.
 */
public record ErrorResponse(String codigo, String message, int status, LocalDateTime timestamp) {
    public ErrorResponse(String codigo, String message, int status) {
        this(codigo, message, status, LocalDateTime.now());
    }
}
