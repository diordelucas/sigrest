package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.PurchaseRequestDTO;
import br.com.sigrest.api.dto.PurchaseResponseDTO;
import br.com.sigrest.api.service.PurchaseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/purchases")
public class PurchaseController {

    @Autowired
    private PurchaseService purchaseService;

    @PostMapping
    public ResponseEntity<PurchaseResponseDTO> createPurchase(@Valid @RequestBody PurchaseRequestDTO purchaseRequestDTO) {
        PurchaseResponseDTO createdPurchase = purchaseService.createPurchase(purchaseRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPurchase);
    }

    @GetMapping
    public ResponseEntity<List<PurchaseResponseDTO>> getAllPurchases() {
        List<PurchaseResponseDTO> purchases = purchaseService.getAllPurchases();
        return ResponseEntity.ok(purchases);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseResponseDTO> getPurchaseById(@PathVariable Long id) {
        PurchaseResponseDTO purchase = purchaseService.getPurchaseById(id);
        return ResponseEntity.ok(purchase);
    }
}
