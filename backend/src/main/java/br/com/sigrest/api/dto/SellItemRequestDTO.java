package br.com.sigrest.api.dto;

import br.com.sigrest.api.entity.SellItem;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SellItemRequestDTO(
        Long id,
        @NotNull(message = "informe o preço unitário") @DecimalMin(value = "0.0", message = "não pode ser negativo") BigDecimal unitPrice,
        @NotNull(message = "informe a quantidade") @DecimalMin(value = "0.01", message = "deve ser maior que zero") BigDecimal quantity,
        @NotNull(message = "selecione o produto") Long productId
) {
    public SellItemRequestDTO(SellItem item){
        this(item.getId(), item.getUnitPrice(), item.getQuantity(), item.getProduct() != null ? item.getProduct().getId() : null);
    }
}
