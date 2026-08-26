package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.StockMovementRequestDTO;
import br.com.sigrest.api.dto.StockMovementResponseDTO;
import br.com.sigrest.api.service.StockMovementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stock-movements")
public class StockMovementController {

    @Autowired
    private StockMovementService stockMovementService;

    @PostMapping
    public ResponseEntity<StockMovementResponseDTO> createStockMovement(@Valid @RequestBody StockMovementRequestDTO stockMovementRequestDTO) {
        StockMovementResponseDTO createdMovement = stockMovementService.createStockMovement(stockMovementRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMovement);
    }

    @GetMapping
    public ResponseEntity<List<StockMovementResponseDTO>> getAllStockMovements() {
        List<StockMovementResponseDTO> movements = stockMovementService.getAllStockMovements();
        return ResponseEntity.ok(movements);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockMovementResponseDTO> getStockMovementById(@PathVariable Long id) {
        StockMovementResponseDTO movement = stockMovementService.getStockMovementById(id);
        return ResponseEntity.ok(movement);
    }
}
