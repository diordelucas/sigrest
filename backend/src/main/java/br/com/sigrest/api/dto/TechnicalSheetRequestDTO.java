package br.com.sigrest.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

public record TechnicalSheetRequestDTO(
        Long id,
        @NotBlank(message = "informe o nome da ficha") String name,
        @NotNull(message = "selecione o produto final") Long finalProductId,
        @NotEmpty(message = "adicione ao menos um insumo") @Valid List<TechnicalSheetItemRequestDTO> items,
        @NotNull(message = "informe o rendimento") @Positive(message = "deve ser maior que zero") Integer rendimento,
        BigDecimal labourCostPercent,
        BigDecimal variableExpensesPercent,
        BigDecimal desiredMarginPercent
) {}
