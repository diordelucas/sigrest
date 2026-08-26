package br.com.sigrest.api.dto;

import br.com.sigrest.api.entity.Sale;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

public record SaleRequestDTO(
        Long id,
        Date date,
        BigDecimal total,
        Integer discount,
        @NotBlank(message = "informe a forma de pagamento") String paymentMethod,
        Long personId,
        @NotEmpty(message = "adicione ao menos um item") @Valid List<SellItemRequestDTO> items,
        /** Gerada pelo frontend por envio de formulário; ver {@link Sale#getIdempotencyKey()}. */
        String idempotencyKey
) {
    public SaleRequestDTO(Sale sale){
        this(sale.getId(), sale.getDate(), sale.getTotal(), sale.getDiscount(), sale.getPaymentMethod(),
             sale.getPerson() != null ? sale.getPerson().getId() : null,
             sale.getItems() != null ? sale.getItems().stream().map(SellItemRequestDTO::new).collect(Collectors.toList()) : null,
             sale.getIdempotencyKey());
    }
}
