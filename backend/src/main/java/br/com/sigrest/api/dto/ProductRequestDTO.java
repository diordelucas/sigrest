package br.com.sigrest.api.dto;

import br.com.sigrest.api.entity.Product;
import br.com.sigrest.api.entity.ProductType;
import br.com.sigrest.api.entity.UnitOfMeasure;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProductRequestDTO(
        Long id,
        @NotBlank(message = "informe o nome do produto") String name,
        String code,
        @NotNull(message = "informe o preço de custo") @DecimalMin(value = "0.0", message = "não pode ser negativo") BigDecimal price,
        @NotNull(message = "informe o preço de venda") @DecimalMin(value = "0.0", message = "não pode ser negativo") BigDecimal sellPrice,
        BigDecimal storage,
        BigDecimal minStorage,
        @NotNull(message = "selecione uma categoria") Long categoryId,
        @NotNull(message = "selecione o tipo do produto") ProductType tipo,
        UnitOfMeasure purchaseUnit,
        BigDecimal packageQuantity
) {
    public ProductRequestDTO(Product product) {
        this(product.getId(), product.getName(), product.getCode(),
                product.getPrice(), product.getSellPrice(),
                product.getStorage(), product.getMinStorage(),
                product.getCategory() != null ? product.getCategory().getId() : null,
                product.getTipo(),
                product.getPurchaseUnit(),
                product.getPackageQuantity());
    }
}
