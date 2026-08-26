package br.com.sigrest.api.service;

import br.com.sigrest.api.dto.SaleRequestDTO;
import br.com.sigrest.api.dto.SaleResponseDTO;
import br.com.sigrest.api.dto.SellItemResponseDTO;
import br.com.sigrest.api.entity.Person;
import br.com.sigrest.api.entity.Product;
import br.com.sigrest.api.entity.Sale;
import br.com.sigrest.api.entity.SellItem;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.PersonRepository;
import br.com.sigrest.api.repository.ProductRepository;
import br.com.sigrest.api.repository.SaleRepository;
import br.com.sigrest.api.service.audit.LogAtividadeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SaleService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockMovementService stockMovementService;

    @Autowired
    private LogAtividadeService logAtividadeService;

    @Transactional
    public SaleResponseDTO createSale(SaleRequestDTO saleRequestDTO) {
        if (saleRequestDTO.idempotencyKey() != null && !saleRequestDTO.idempotencyKey().isBlank()) {
            var existing = saleRepository.findByIdempotencyKey(saleRequestDTO.idempotencyKey());
            if (existing.isPresent()) {
                return convertToResponseDTO(existing.get());
            }
        }

        Sale sale = new Sale();
        sale.setDate(new Date()); // Set current date for the sale
        sale.setDiscount(saleRequestDTO.discount());
        sale.setPaymentMethod(saleRequestDTO.paymentMethod());
        sale.setIdempotencyKey(saleRequestDTO.idempotencyKey());

        if (saleRequestDTO.personId() != null) {
            Person person = personRepository.findById(saleRequestDTO.personId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PERSON_NAO_ENCONTRADA));
            sale.setPerson(person);
        }

        BigDecimal total = BigDecimal.ZERO;
        for (var itemDTO : saleRequestDTO.items()) {
            Product product = productRepository.findById(itemDTO.productId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PROD_NAO_ENCONTRADO, "Produto não encontrado: " + itemDTO.productId()));

            BigDecimal currentStock = product.getStorage() != null ? product.getStorage() : java.math.BigDecimal.ZERO;
            if (currentStock.compareTo(itemDTO.quantity()) < 0) {
                throw new BusinessException(ErrorCode.STOCK_INSUFICIENTE, "Estoque insuficiente para o produto: " + product.getName());
            }

            SellItem sellItem = new SellItem();
            sellItem.setProduct(product);
            sellItem.setQuantity(itemDTO.quantity());
            sellItem.setUnitPrice(itemDTO.unitPrice());
            sellItem.setSale(sale);
            sale.getItems().add(sellItem);

            total = total.add(itemDTO.unitPrice().multiply(itemDTO.quantity()));

            // Deduct stock (vendas de PRODUTO_FINAL são descontadas em UN)
            stockMovementService.createStockExit(product, itemDTO.quantity(), "Venda #" + sale.getId());
        }
        sale.setTotal(total.subtract(BigDecimal.valueOf(sale.getDiscount()))); // Apply discount to total

        Sale savedSale = saleRepository.save(sale);
        logAtividadeService.registrar("CRIAR_VENDA", "Sale", savedSale.getId(),
                "Total: " + savedSale.getTotal(), logAtividadeService.usuarioAtual());
        return convertToResponseDTO(savedSale);
    }

    @Transactional(readOnly = true)
    public List<SaleResponseDTO> getAllSales() {
        return saleRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SaleResponseDTO getSaleById(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SALE_NAO_ENCONTRADA));
        return convertToResponseDTO(sale);
    }

    private SaleResponseDTO convertToResponseDTO(Sale sale) {
        return new SaleResponseDTO(
            sale.getId(),
            sale.getDate(),
            sale.getTotal(),
            sale.getDiscount(),
            sale.getPaymentMethod(),
            sale.getPerson() != null ? sale.getPerson().getName() : null,
            sale.getItems().stream()
                .map(item -> new SellItemResponseDTO(
                    item.getId(),
                    item.getUnitPrice(),
                    item.getQuantity(),
                    item.getProduct() != null ? item.getProduct().getId() : null,
                    item.getProduct() != null ? item.getProduct().getName() : null
                ))
                .collect(Collectors.toList())
        );
    }
}

