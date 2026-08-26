package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.CashRegisterRequestDTO;
import br.com.sigrest.api.dto.CashRegisterResponseDTO;
import br.com.sigrest.api.entity.User;
import br.com.sigrest.api.service.CashRegisterService;
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
@RequestMapping("/cash-registers")
public class CashRegisterController {

    @Autowired
    private CashRegisterService cashRegisterService;

    // Quem abre/fecha o caixa e quem esta autenticado — nao um id que o cliente informe.
    @PostMapping("/open")
    public ResponseEntity<CashRegisterResponseDTO> openCashRegister(@Valid @RequestBody CashRegisterRequestDTO requestDTO,
                                                                      @AuthenticationPrincipal User currentUser) {
        requestDTO.setOpenedByUserId(currentUser.getId());
        CashRegisterResponseDTO openedCashRegister = cashRegisterService.openCashRegister(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(openedCashRegister);
    }

    @PostMapping("/close/{id}")
    public ResponseEntity<CashRegisterResponseDTO> closeCashRegister(@PathVariable Long id,
                                                                       @AuthenticationPrincipal User currentUser) {
        CashRegisterResponseDTO closedCashRegister = cashRegisterService.closeCashRegister(id, currentUser.getId());
        return ResponseEntity.ok(closedCashRegister);
    }

    @GetMapping("/current-open")
    public ResponseEntity<CashRegisterResponseDTO> getCurrentOpenCashRegister() {
        CashRegisterResponseDTO currentOpen = cashRegisterService.getCurrentOpenCashRegister();
        return currentOpen != null ? ResponseEntity.ok(currentOpen) : ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<CashRegisterResponseDTO>> getAllCashRegisters() {
        List<CashRegisterResponseDTO> cashRegisters = cashRegisterService.getAllCashRegisters();
        return ResponseEntity.ok(cashRegisters);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CashRegisterResponseDTO> getCashRegisterById(@PathVariable Long id) {
        CashRegisterResponseDTO cashRegister = cashRegisterService.getCashRegisterById(id);
        return ResponseEntity.ok(cashRegister);
    }
}
