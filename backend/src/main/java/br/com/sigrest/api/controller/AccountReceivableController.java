package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.AccountReceivableRequestDTO;
import br.com.sigrest.api.dto.AccountReceivableResponseDTO;
import br.com.sigrest.api.entity.User;
import br.com.sigrest.api.service.AccountReceivableService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Modulo financeiro: acesso restrito a ADMIN (TCC, secao 5.1). */
@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/accounts-receivable")
public class AccountReceivableController {

    @Autowired
    private AccountReceivableService accountReceivableService;

    @PostMapping
    public ResponseEntity<AccountReceivableResponseDTO> createAccountReceivable(@Valid @RequestBody AccountReceivableRequestDTO requestDTO) {
        AccountReceivableResponseDTO createdAccount = accountReceivableService.createAccountReceivable(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAccount);
    }

    // O responsavel pelo recebimento e quem esta autenticado — usado para lancar o movimento de caixa.
    @PutMapping("/receive/{id}")
    public ResponseEntity<AccountReceivableResponseDTO> receiveAccountReceivable(@PathVariable Long id,
                                                                                    @AuthenticationPrincipal User currentUser) {
        AccountReceivableResponseDTO receivedAccount = accountReceivableService.receiveAccountReceivable(id, currentUser);
        return ResponseEntity.ok(receivedAccount);
    }

    @GetMapping
    public ResponseEntity<List<AccountReceivableResponseDTO>> getAllAccountReceivables() {
        List<AccountReceivableResponseDTO> accounts = accountReceivableService.getAllAccountReceivables();
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountReceivableResponseDTO> getAccountReceivableById(@PathVariable Long id) {
        AccountReceivableResponseDTO account = accountReceivableService.getAccountReceivableById(id);
        return ResponseEntity.ok(account);
    }
}
