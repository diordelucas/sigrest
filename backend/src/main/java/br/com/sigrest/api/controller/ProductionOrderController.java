package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.ProductionOrderRequestDTO;
import br.com.sigrest.api.dto.ProductionOrderResponseDTO;
import br.com.sigrest.api.entity.ProductionOrder;
import br.com.sigrest.api.service.ProductionOrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/production-order")
public class ProductionOrderController {

    @Autowired
    private ProductionOrderService service;

    @PostMapping
    public ProductionOrderResponseDTO save(@Valid @RequestBody ProductionOrderRequestDTO data) {
        return new ProductionOrderResponseDTO(service.save(data));
    }

    @GetMapping
    public List<ProductionOrderResponseDTO> getAll() {
        return service.findAll().stream().map(ProductionOrderResponseDTO::new).toList();
    }

    @GetMapping("/{id}")
    public ProductionOrderResponseDTO getById(@PathVariable Long id) {
        return new ProductionOrderResponseDTO(service.findById(id));
    }

    @PutMapping("/{id}")
    public ProductionOrderResponseDTO update(@PathVariable Long id, @Valid @RequestBody ProductionOrderRequestDTO data) {
        ProductionOrderRequestDTO dto = new ProductionOrderRequestDTO(id, data.finalProductId(), data.quantity(), data.notes());
        return new ProductionOrderResponseDTO(service.save(dto));
    }

    @PostMapping("/{id}/finish")
    public ProductionOrderResponseDTO finishProduction(@PathVariable Long id) {
        return new ProductionOrderResponseDTO(service.finishProduction(id));
    }

    /** Exclusao de ordem de producao e privilegio de administrador (mesmo padrao de ProductController). */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
