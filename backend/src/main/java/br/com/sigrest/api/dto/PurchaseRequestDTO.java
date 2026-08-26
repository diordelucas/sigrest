package br.com.sigrest.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class PurchaseRequestDTO {
    @NotNull(message = "informe a data")
    private LocalDate date;

    private BigDecimal total;

    @NotNull(message = "selecione o fornecedor")
    private Long supplierId;

    @NotEmpty(message = "adicione ao menos um item")
    @Valid
    private List<PurchaseItemRequestDTO> items;

    /** Gerada pelo frontend por envio de formulário; ver Purchase.idempotencyKey. */
    private String idempotencyKey;
}
