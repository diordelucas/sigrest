package br.com.sigrest.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AccountPayableRequestDTO {
    @NotBlank(message = "informe a descrição")
    private String description;

    @NotNull(message = "informe o valor")
    @DecimalMin(value = "0.01", message = "deve ser maior que zero")
    private BigDecimal amount;

    @NotNull(message = "informe o vencimento")
    private LocalDate dueDate;

    @NotNull(message = "selecione o fornecedor")
    private Long supplierId;
}
