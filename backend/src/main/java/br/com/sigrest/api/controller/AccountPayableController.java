package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.AccountPayableRequestDTO;
import br.com.sigrest.api.dto.AccountPayableResponseDTO;
import br.com.sigrest.api.entity.User;
import br.com.sigrest.api.service.AccountPayableService;
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
@RequestMapping("/accounts-payable")
public class AccountPayableController {

    @Autowired
    private AccountPayableService accountPayableService;

    @PostMapping
    public ResponseEntity<AccountPayableResponseDTO> createAccountPayable(@Valid @RequestBody AccountPayableRequestDTO requestDTO) {
        AccountPayableResponseDTO createdAccount = accountPayableService.createAccountPayable(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAccount);
    }

    // O responsavel pelo pagamento e quem esta autenticado — usado para lancar o movimento de caixa.
    @PutMapping("/pay/{id}")
    public ResponseEntity<AccountPayableResponseDTO> payAccountPayable(@PathVariable Long id,
                                                                          @AuthenticationPrincipal User currentUser) {
        AccountPayableResponseDTO paidAccount = accountPayableService.payAccountPayable(id, currentUser);
        return ResponseEntity.ok(paidAccount);
    }

    @GetMapping
    public ResponseEntity<List<AccountPayableResponseDTO>> getAllAccountPayables() {
        List<AccountPayableResponseDTO> accounts = accountPayableService.getAllAccountPayables();
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountPayableResponseDTO> getAccountPayableById(@PathVariable Long id) {
        AccountPayableResponseDTO account = accountPayableService.getAccountPayableById(id);
        return ResponseEntity.ok(account);
    }
}
