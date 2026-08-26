package br.com.sigrest.api.dto;

import br.com.sigrest.api.entity.StockMovement;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class StockMovementRequestDTO {
    @NotNull(message = "selecione o produto")
    private Long productId;

    @NotNull(message = "informe o tipo do movimento")
    private StockMovement.MovementType type;

    @NotNull(message = "informe a quantidade")
    @DecimalMin(value = "0.01", message = "deve ser maior que zero")
    private BigDecimal quantity;

    private LocalDateTime date;
    private String description;
}
