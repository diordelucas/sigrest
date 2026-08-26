package br.com.sigrest.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ProductionOrderRequestDTO(
        Long id,
        @NotNull(message = "selecione o produto final") Long finalProductId,
        @NotNull(message = "informe a quantidade") @Positive(message = "deve ser maior que zero") Integer quantity,
        String notes
) {}
