package br.com.sigrest.api.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.UUID;
import java.util.stream.Collectors;

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

    /** Falha de {@code @Valid} nos DTOs de entrada — junta os campos inválidos numa mensagem única. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidacao(MethodArgumentNotValidException ex) {
        String mensagem = ex.getBindingResult().getFieldErrors().stream()
                .map(erro -> erro.getField() + ": " + erro.getDefaultMessage())
                .collect(Collectors.joining("; "));
        if (mensagem.isBlank()) {
            mensagem = ErrorCode.GEN_VALIDACAO_FALHOU.getMensagemPadrao();
        }
        ErrorCode code = ErrorCode.GEN_VALIDACAO_FALHOU;
        return ResponseEntity.status(code.getStatus())
                .body(new ErrorResponse(code.getCodigo(), mensagem, code.getStatus().value()));
    }

    /**
     * Conflito de lock otimista (ver {@code @Version} em {@code Product}): duas operações
     * concorrentes tentaram alterar o mesmo registro. O cliente deve tentar novamente.
     */
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleConcorrencia(ObjectOptimisticLockingFailureException ex) {
        return responseFor(ErrorCode.STOCK_CONFLITO_CONCORRENCIA);
    }

    /** Violação de constraint do banco (ex.: índice único) que escapou da validação de negócio. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleIntegridade(DataIntegrityViolationException ex) {
        return responseFor(ErrorCode.GEN_CONFLITO_DADOS);
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
