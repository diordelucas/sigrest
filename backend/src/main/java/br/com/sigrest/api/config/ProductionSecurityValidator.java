package br.com.sigrest.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * Recusa o boot em produção se os segredos ainda estiverem nos valores padrão de
 * desenvolvimento. Sem isso, nada impedia subir para produção com
 * {@code JWT_SECRET=sigrest-dev-secret-trocar-em-producao} e {@code DB_PASSWORD=admin123}
 * (ver PLANO_ACAO_COMPLETO.md, item 5 — inspirado no ProducaoSegurancaValidator do mpg-gestao).
 *
 * <p>Só age quando o profile {@code prod} está ativo — em desenvolvimento os defaults continuam
 * funcionando normalmente.
 */
@Component
public class ProductionSecurityValidator {

    private static final String JWT_SECRET_PADRAO = "sigrest-dev-secret-trocar-em-producao";
    private static final String DB_PASSWORD_PADRAO = "admin123";
    private static final String ADMIN_PASSWORD_PADRAO = "admin123";

    private final Environment environment;

    @Value("${api.security.token.secret}")
    private String jwtSecret;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Value("${app.admin.password}")
    private String adminPassword;

    public ProductionSecurityValidator(Environment environment) {
        this.environment = environment;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void validar() {
        boolean producao = Arrays.asList(environment.getActiveProfiles()).contains("prod");
        if (!producao) {
            return;
        }

        StringBuilder problemas = new StringBuilder();
        if (JWT_SECRET_PADRAO.equals(jwtSecret)) {
            problemas.append("- JWT_SECRET ainda está no valor padrão de desenvolvimento.\n");
        }
        if (DB_PASSWORD_PADRAO.equals(dbPassword)) {
            problemas.append("- DB_PASSWORD ainda está no valor padrão de desenvolvimento.\n");
        }
        if (ADMIN_PASSWORD_PADRAO.equals(adminPassword)) {
            problemas.append("- ADMIN_PASSWORD ainda está no valor padrão de desenvolvimento.\n");
        }

        if (problemas.length() > 0) {
            throw new IllegalStateException(
                    "Boot em produção recusado — segredos de desenvolvimento ainda em uso:\n" + problemas
                            + "Defina variáveis de ambiente com valores próprios antes de subir em produção.");
        }
    }
}
