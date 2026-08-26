package br.com.sigrest.api.service.audit;

import br.com.sigrest.api.entity.ActivityLog;
import br.com.sigrest.api.entity.User;
import br.com.sigrest.api.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Auditoria de operações financeiras/sensíveis. Antes desta sessão, o SIGREST não tinha nenhum
 * log de atividade (ver PLANO_ACAO_COMPLETO.md, item 10) — qualquer pergunta de "quem fez o quê"
 * dependia de olhar direto no banco.
 */
@Service
public class LogAtividadeService {

    @Autowired
    private ActivityLogRepository repository;

    /** Grava um evento de auditoria. Faz parte da mesma transação do chamador de propósito:
     *  se a operação de negócio for revertida, o log também é. */
    public void registrar(String acao, String entidade, Long entidadeId, String detalhes, User usuario) {
        ActivityLog log = new ActivityLog();
        log.setDataHora(LocalDateTime.now());
        log.setAcao(acao);
        log.setEntidade(entidade);
        log.setEntidadeId(entidadeId);
        log.setDetalhes(detalhes);
        if (usuario != null) {
            log.setUsuarioId(usuario.getId());
            log.setUsuarioNome(usuario.getName());
        }
        repository.save(log);
    }

    /** Usuário autenticado da requisição atual (setado pelo SecurityFilter), ou null fora de um request. */
    public User usuarioAtual() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return user;
        }
        return null;
    }

    public List<ActivityLog> ultimos(int quantidade) {
        Pageable pageable = PageRequest.of(0, Math.max(1, Math.min(quantidade, 500)));
        return repository.findAllByOrderByDataHoraDesc(pageable);
    }
}
