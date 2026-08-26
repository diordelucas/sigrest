package br.com.sigrest.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CashRegisterRequestDTO {
    private LocalDateTime openingTime;

    @NotNull(message = "informe o saldo de abertura")
    @DecimalMin(value = "0.0", message = "não pode ser negativo")
    private BigDecimal openingBalance;

    private Long openedByUserId;
}
