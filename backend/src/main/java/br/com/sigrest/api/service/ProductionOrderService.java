package br.com.sigrest.api.service;

import br.com.sigrest.api.dto.ProductionOrderRequestDTO;
import br.com.sigrest.api.entity.Product;
import br.com.sigrest.api.entity.ProductionOrder;
import br.com.sigrest.api.entity.TechnicalSheet;
import br.com.sigrest.api.entity.TechnicalSheetItem;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.ProductRepository;
import br.com.sigrest.api.repository.ProductionOrderRepository;
import br.com.sigrest.api.repository.TechnicalSheetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProductionOrderService {

    @Autowired
    private ProductionOrderRepository repository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TechnicalSheetRepository technicalSheetRepository;

    @Autowired
    private StockMovementService stockMovementService;

    @Transactional(readOnly = true)
    public List<ProductionOrder> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public ProductionOrder findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.PORD_NAO_ENCONTRADA));
    }

    @Transactional
    public ProductionOrder save(ProductionOrderRequestDTO dto) {
        ProductionOrder order = new ProductionOrder();
        if (dto.id() != null) {
            order = findById(dto.id());
        } else {
            order.setDate(LocalDateTime.now());
            order.setStatus(ProductionOrder.Status.OPEN);
        }

        Product finalProduct = productRepository.findById(dto.finalProductId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PROD_NAO_ENCONTRADO));

        order.setFinalProduct(finalProduct);
        order.setQuantity(dto.quantity());
        order.setNotes(dto.notes());

        return repository.save(order);
    }

    @Transactional
    public ProductionOrder finishProduction(Long id) {
        ProductionOrder order = findById(id);

        if (order.getStatus() == ProductionOrder.Status.FINISHED) {
            throw new BusinessException(ErrorCode.PORD_JA_FINALIZADA);
        }
        if (order.getStatus() == ProductionOrder.Status.CANCELLED) {
            throw new BusinessException(ErrorCode.PORD_CANCELADA);
        }

        Product finalProduct = order.getFinalProduct();
        if (finalProduct == null) {
            throw new BusinessException(ErrorCode.PORD_PRODUTO_NAO_ASSOCIADO);
        }

        TechnicalSheet sheet = technicalSheetRepository.findByFinalProductId(finalProduct.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PORD_SEM_FICHA_TECNICA,
                        "Ficha técnica não encontrada para o produto final: " + finalProduct.getName()));

        // 1. Calcular total necessário por insumo (em unidade base) e validar estoque
        for (TechnicalSheetItem item : sheet.getItems()) {
            Product rawMaterial = item.getRawMaterial();
            BigDecimal totalNeeded = toBaseUnits(item).multiply(BigDecimal.valueOf(order.getQuantity()));

            BigDecimal currentStock = rawMaterial.getStorage() != null ? rawMaterial.getStorage() : BigDecimal.ZERO;
            if (currentStock.compareTo(totalNeeded) < 0) {
                String unit = item.getUnit() != null ? item.getUnit().getBaseUnitLabel() : "un";
                throw new BusinessException(ErrorCode.STOCK_INSUFICIENTE, "Estoque insuficiente para o insumo: " + rawMaterial.getName()
                        + " (Necessário: " + totalNeeded + " " + unit
                        + ", Disponível: " + currentStock + " " + unit + ")");
            }
        }

        // 2. Dar baixa nos insumos (em unidade base)
        for (TechnicalSheetItem item : sheet.getItems()) {
            Product rawMaterial = item.getRawMaterial();
            BigDecimal totalNeeded = toBaseUnits(item).multiply(BigDecimal.valueOf(order.getQuantity()));
            String desc = "Consumo OP #" + order.getId() + " - " + sheet.getName();
            stockMovementService.createStockExit(rawMaterial, totalNeeded, desc);
        }

        // 3. Dar entrada no produto acabado (em unidades — PRODUTO_FINAL usa UN)
        String entryDesc = "Produção OP #" + order.getId() + " - " + sheet.getName();
        stockMovementService.createStockEntry(finalProduct, BigDecimal.valueOf(order.getQuantity()), entryDesc);

        order.setStatus(ProductionOrder.Status.FINISHED);
        return repository.save(order);
    }

    @Transactional
    public void delete(Long id) {
        ProductionOrder order = findById(id);
        repository.delete(order);
    }

    /**
     * Converte a quantidade de um item da ficha técnica para sua unidade base.
     * Ex: 250 G → 250 (já em gramas, fator=1); 0.25 KG → 250 (0.25 × 1000)
     * Se unit for null, retorna a quantidade como escalar sem conversão.
     */
    private BigDecimal toBaseUnits(TechnicalSheetItem item) {
        if (item.getUnit() != null) {
            return item.getQuantity().multiply(item.getUnit().getConversionFactor());
        }
        return item.getQuantity();
    }
}