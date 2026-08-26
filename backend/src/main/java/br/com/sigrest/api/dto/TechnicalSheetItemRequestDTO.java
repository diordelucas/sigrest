package br.com.sigrest.api.dto;

import br.com.sigrest.api.entity.UnitOfMeasure;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record TechnicalSheetItemRequestDTO(
        Long id,
        @NotNull(message = "selecione o insumo") Long rawMaterialId,
        @NotNull(message = "informe a quantidade") @DecimalMin(value = "0.01", message = "deve ser maior que zero") BigDecimal quantity,
        UnitOfMeasure unit
) {}
