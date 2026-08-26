package br.com.sigrest.api.service;

import br.com.sigrest.api.dto.StockMovementRequestDTO;
import br.com.sigrest.api.dto.StockMovementResponseDTO;
import br.com.sigrest.api.dto.ProductResponseDTO;
import br.com.sigrest.api.entity.Product;
import br.com.sigrest.api.entity.StockMovement;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.ProductRepository;
import br.com.sigrest.api.repository.StockMovementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StockMovementService {

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private ProductRepository productRepository;

    @Transactional
    public StockMovementResponseDTO createStockMovement(StockMovementRequestDTO requestDTO) {
        Product product = productRepository.findById(requestDTO.getProductId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PROD_NAO_ENCONTRADO));

        StockMovement stockMovement = new StockMovement();
        stockMovement.setProduct(product);
        stockMovement.setType(requestDTO.getType());
        stockMovement.setQuantity(requestDTO.getQuantity());
        stockMovement.setDate(LocalDateTime.now());
        stockMovement.setDescription(requestDTO.getDescription());

        updateProductStorage(product, requestDTO.getQuantity(), requestDTO.getType());

        StockMovement savedMovement = stockMovementRepository.save(stockMovement);
        return convertToResponseDTO(savedMovement);
    }

    @Transactional
    public void createStockEntry(Product product, BigDecimal quantity, String description) {
        StockMovement stockMovement = new StockMovement();
        stockMovement.setProduct(product);
        stockMovement.setType(StockMovement.MovementType.ENTRY);
        stockMovement.setQuantity(quantity);
        stockMovement.setDate(LocalDateTime.now());
        stockMovement.setDescription(description);

        updateProductStorage(product, quantity, StockMovement.MovementType.ENTRY);
        stockMovementRepository.save(stockMovement);
    }

    @Transactional
    public void createStockExit(Product product, BigDecimal quantity, String description) {
        StockMovement stockMovement = new StockMovement();
        stockMovement.setProduct(product);
        stockMovement.setType(StockMovement.MovementType.EXIT);
        stockMovement.setQuantity(quantity);
        stockMovement.setDate(LocalDateTime.now());
        stockMovement.setDescription(description);

        updateProductStorage(product, quantity, StockMovement.MovementType.EXIT);
        stockMovementRepository.save(stockMovement);
    }

    private void updateProductStorage(Product product, BigDecimal quantity, StockMovement.MovementType type) {
        BigDecimal current = product.getStorage() != null ? product.getStorage() : BigDecimal.ZERO;
        if (type == StockMovement.MovementType.ENTRY) {
            product.setStorage(current.add(quantity));
        } else if (type == StockMovement.MovementType.EXIT) {
            if (current.compareTo(quantity) < 0) {
                throw new BusinessException(ErrorCode.STOCK_INSUFICIENTE, "Estoque insuficiente para o produto: " + product.getName());
            }
            product.setStorage(current.subtract(quantity));
        }
        productRepository.save(product);
    }

    public List<StockMovementResponseDTO> getAllStockMovements() {
        return stockMovementRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    public StockMovementResponseDTO getStockMovementById(Long id) {
        StockMovement stockMovement = stockMovementRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.STOCK_MOVIMENTO_NAO_ENCONTRADO));
        return convertToResponseDTO(stockMovement);
    }

    private StockMovementResponseDTO convertToResponseDTO(StockMovement stockMovement) {
        StockMovementResponseDTO dto = new StockMovementResponseDTO();
        dto.setId(stockMovement.getId());
        dto.setType(stockMovement.getType());
        dto.setQuantity(stockMovement.getQuantity());
        dto.setDate(stockMovement.getDate());
        dto.setDescription(stockMovement.getDescription());
        if (stockMovement.getProduct() != null) {
            dto.setProduct(new ProductResponseDTO(stockMovement.getProduct()));
        }
        return dto;
    }
}