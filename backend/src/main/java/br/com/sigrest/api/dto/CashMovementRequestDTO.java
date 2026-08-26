package br.com.sigrest.api.dto;

import br.com.sigrest.api.entity.CashMovement;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CashMovementRequestDTO {
    @NotNull(message = "informe o caixa")
    private Long cashRegisterId;

    @NotNull(message = "informe o tipo do movimento")
    private CashMovement.MovementType type;

    @NotNull(message = "informe o valor")
    @DecimalMin(value = "0.01", message = "deve ser maior que zero")
    private BigDecimal amount;

    private String description;

    private Long userId;
}
