package br.com.sigrest.api.exception;

import org.springframework.http.HttpStatus;

/**
 * Exceção para violação de regra de negócio (ex.: "já existe um caixa aberto").
 *
 * <p>Carrega um {@link ErrorCode}, que já define a mensagem padrão e o status HTTP. Use o
 * construtor com {@code mensagemDetalhada} apenas quando a mensagem precisa de um dado dinâmico
 * (ex.: o nome do produto sem estoque) — o código continua o mesmo, só o texto muda.
 */
public class BusinessException extends RuntimeException {

    private final ErrorCode code;

    public BusinessException(ErrorCode code) {
        super(code.getMensagemPadrao());
        this.code = code;
    }

    public BusinessException(ErrorCode code, String mensagemDetalhada) {
        super(mensagemDetalhada);
        this.code = code;
    }

    public ErrorCode getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return code.getStatus();
    }
}
