package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.ActivityLogResponseDTO;
import br.com.sigrest.api.service.audit.LogAtividadeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Auditoria: acesso restrito a ADMIN, mesmo padrão do módulo financeiro. */
@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/activity-logs")
public class ActivityLogController {

    @Autowired
    private LogAtividadeService logAtividadeService;

    @GetMapping
    public List<ActivityLogResponseDTO> getUltimos(@RequestParam(defaultValue = "200") int limite) {
        return logAtividadeService.ultimos(limite).stream().map(ActivityLogResponseDTO::new).toList();
    }
}
