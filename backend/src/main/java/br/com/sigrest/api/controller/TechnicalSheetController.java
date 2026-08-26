package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.CostCalculationResponseDTO;
import br.com.sigrest.api.dto.TechnicalSheetRequestDTO;
import br.com.sigrest.api.dto.TechnicalSheetResponseDTO;
import br.com.sigrest.api.service.TechnicalSheetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/technical-sheet")
public class TechnicalSheetController {

    @Autowired
    private TechnicalSheetService service;

    @PostMapping
    public TechnicalSheetResponseDTO save(@RequestBody TechnicalSheetRequestDTO data) {
        return service.save(data);
    }

    @GetMapping
    public List<TechnicalSheetResponseDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public TechnicalSheetResponseDTO getById(@PathVariable Long id) {
        return service.getSheet(id);
    }

    @GetMapping("/{id}/calculate-cost")
    public CostCalculationResponseDTO calculateCost(@PathVariable Long id) {
        return service.calculateCost(id);
    }

    @PutMapping("/{id}")
    public TechnicalSheetResponseDTO update(@PathVariable Long id, @RequestBody TechnicalSheetRequestDTO data) {
        TechnicalSheetRequestDTO dto = new TechnicalSheetRequestDTO(
                id, data.name(), data.finalProductId(), data.items(),
                data.rendimento(), data.labourCostPercent(),
                data.variableExpensesPercent(), data.desiredMarginPercent());
        return service.save(dto);
    }

    /** Exclusao de ficha tecnica e privilegio de administrador (mesmo padrao de ProductController). */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}