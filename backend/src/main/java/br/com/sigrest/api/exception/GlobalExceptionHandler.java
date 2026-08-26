package br.com.sigrest.api.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.UUID;

/**
 * Centraliza a tradução de exceções em respostas HTTP limpas, cada uma com um {@code codigo}
 * estável ({@link ErrorCode}) que o suporte usa para localizar a causa raiz.
 *
 * <p>O handler de {@link Exception} é o piso de segurança: qualquer coisa não mapeada vira
 * {@code SIGREST-GEN-500} com uma mensagem genérica para o cliente, mas o stack trace completo
 * e um {@code traceId} vão para o log do servidor — nada de detalhe interno vaza na resposta.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
        ErrorCode code = ex.getCode();
        ErrorResponse body = new ErrorResponse(code.getCodigo(), ex.getMessage(), code.getStatus().value());
        return ResponseEntity.status(code.getStatus()).body(body);
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
    })
    public ResponseEntity<ErrorResponse> handleRequisicaoInvalida(Exception ex) {
        return responseFor(ErrorCode.GEN_REQUISICAO_INVALIDA);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleParametroAusente(MissingServletRequestParameterException ex) {
        return responseFor(ErrorCode.GEN_PARAMETRO_AUSENTE);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenerico(Exception ex) {
        String traceId = UUID.randomUUID().toString();
        log.error("Erro nao tratado [traceId={}]", traceId, ex);
        ErrorCode code = ErrorCode.GEN_ERRO_INTERNO;
        String mensagem = code.getMensagemPadrao() + " (traceId: " + traceId + ")";
        ErrorResponse body = new ErrorResponse(code.getCodigo(), mensagem, code.getStatus().value());
        return ResponseEntity.status(code.getStatus()).body(body);
    }

    private ResponseEntity<ErrorResponse> responseFor(ErrorCode code) {
        ErrorResponse body = new ErrorResponse(code.getCodigo(), code.getMensagemPadrao(), code.getStatus().value());
        return ResponseEntity.status(code.getStatus()).body(body);
    }
}
