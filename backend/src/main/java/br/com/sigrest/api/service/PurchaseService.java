package br.com.sigrest.api.service;

import br.com.sigrest.api.dto.PurchaseRequestDTO;
import br.com.sigrest.api.dto.PurchaseResponseDTO;
import br.com.sigrest.api.dto.SupplierResponseDTO;
import br.com.sigrest.api.dto.ProductResponseDTO;
import br.com.sigrest.api.dto.PurchaseItemResponseDTO;
import br.com.sigrest.api.entity.Product;
import br.com.sigrest.api.entity.Purchase;
import br.com.sigrest.api.entity.PurchaseItem;
import br.com.sigrest.api.entity.Supplier;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.ProductRepository;
import br.com.sigrest.api.repository.PurchaseRepository;
import br.com.sigrest.api.repository.SupplierRepository;
import br.com.sigrest.api.service.audit.LogAtividadeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PurchaseService {

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockMovementService stockMovementService;

    @Autowired
    private LogAtividadeService logAtividadeService;

    @Transactional
    public PurchaseResponseDTO createPurchase(PurchaseRequestDTO purchaseRequestDTO) {
        String idempotencyKey = purchaseRequestDTO.getIdempotencyKey();
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var existing = purchaseRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                return convertToResponseDTO(existing.get());
            }
        }

        Purchase purchase = new Purchase();
        purchase.setDate(purchaseRequestDTO.getDate());
        purchase.setIdempotencyKey(idempotencyKey);

        Supplier supplier = supplierRepository.findById(purchaseRequestDTO.getSupplierId())
                .orElseThrow(() -> new BusinessException(ErrorCode.SUPP_NAO_ENCONTRADO));
        purchase.setSupplier(supplier);

        // Salva o cabeçalho primeiro para ter o id real disponível na descrição das
        // movimentações de estoque abaixo (senão "Compra #" + purchase.getId() sai como "Compra #null").
        purchase = purchaseRepository.save(purchase);

        BigDecimal total = BigDecimal.ZERO;
        for (var itemDTO : purchaseRequestDTO.getItems()) {
            Product product = productRepository.findById(itemDTO.getProductId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PROD_NAO_ENCONTRADO));

            PurchaseItem purchaseItem = new PurchaseItem();
            purchaseItem.setProduct(product);
            purchaseItem.setQuantity(itemDTO.getQuantity());
            purchaseItem.setUnitPrice(itemDTO.getUnitPrice());
            purchaseItem.setPurchase(purchase);
            purchase.getItems().add(purchaseItem);

            total = total.add(itemDTO.getUnitPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity())));

            // Calcular entrada de estoque em unidade base
            // Se o produto tem UDM de compra configurada: qtde_pacotes × unidades_base/pacote
            // Caso contrário, usar a quantidade de pacotes como escalar
            BigDecimal stockEntry = toBaseUnits(product, itemDTO.getQuantity());
            stockMovementService.createStockEntry(product, stockEntry, "Compra #" + purchase.getId());
        }
        purchase.setTotal(total);

        Purchase savedPurchase = purchaseRepository.save(purchase);
        logAtividadeService.registrar("CRIAR_COMPRA", "Purchase", savedPurchase.getId(),
                "Total: " + savedPurchase.getTotal(), logAtividadeService.usuarioAtual());
        return convertToResponseDTO(savedPurchase);
    }

    /**
     * Converte a quantidade de pacotes comprados para a unidade base do produto.
     * Ex: 2 pacotes de 5 KG → 2 × 5 × 1000 = 10.000 g
     */
    private BigDecimal toBaseUnits(Product product, int numberOfPackages) {
        if (product.getPurchaseUnit() != null && product.getPackageQuantity() != null
                && product.getPackageQuantity().compareTo(BigDecimal.ZERO) > 0) {
            return BigDecimal.valueOf(numberOfPackages)
                    .multiply(product.getPackageQuantity())
                    .multiply(product.getPurchaseUnit().getConversionFactor());
        }
        return BigDecimal.valueOf(numberOfPackages);
    }

    @Transactional(readOnly = true)
    public List<PurchaseResponseDTO> getAllPurchases() {
        return purchaseRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PurchaseResponseDTO getPurchaseById(Long id) {
        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PURCH_NAO_ENCONTRADA));
        return convertToResponseDTO(purchase);
    }

    private PurchaseResponseDTO convertToResponseDTO(Purchase purchase) {
        PurchaseResponseDTO dto = new PurchaseResponseDTO();
        dto.setId(purchase.getId());
        dto.setDate(purchase.getDate());
        dto.setTotal(purchase.getTotal());
        if (purchase.getSupplier() != null) {
            dto.setSupplier(new SupplierResponseDTO(purchase.getSupplier()));
        }
        dto.setItems(purchase.getItems().stream().map(item -> {
            PurchaseItemResponseDTO itemDTO = new PurchaseItemResponseDTO();
            itemDTO.setId(item.getId());
            itemDTO.setQuantity(item.getQuantity());
            itemDTO.setUnitPrice(item.getUnitPrice());
            if (item.getProduct() != null) {
                itemDTO.setProduct(new ProductResponseDTO(item.getProduct()));
            }
            return itemDTO;
        }).collect(Collectors.toList()));
        return dto;
    }
}