package br.com.sigrest.api.dto;

import br.com.sigrest.api.entity.ActivityLog;

import java.time.LocalDateTime;

public record ActivityLogResponseDTO(
        Long id,
        LocalDateTime dataHora,
        String acao,
        String entidade,
        Long entidadeId,
        String detalhes,
        Long usuarioId,
        String usuarioNome
) {
    public ActivityLogResponseDTO(ActivityLog log) {
        this(log.getId(), log.getDataHora(), log.getAcao(), log.getEntidade(), log.getEntidadeId(),
                log.getDetalhes(), log.getUsuarioId(), log.getUsuarioNome());
    }
}
