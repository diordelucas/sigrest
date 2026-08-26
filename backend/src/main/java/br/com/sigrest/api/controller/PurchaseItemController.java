package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.PurchaseItemRequestDTO;
import br.com.sigrest.api.dto.PurchaseItemResponseDTO;
import br.com.sigrest.api.entity.PurchaseItem;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.PurchaseItemRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("purchase_item")
public class PurchaseItemController {

    @Autowired
    private PurchaseItemRepository repository;

    @PostMapping
    public void savePurchaseItem(@Valid @RequestBody PurchaseItemRequestDTO data){
        PurchaseItem purchaseItemData = new PurchaseItem();
        purchaseItemData.setQuantity(data.getQuantity());
        purchaseItemData.setUnitPrice(data.getUnitPrice());
        repository.save(purchaseItemData);
    }

    @GetMapping
    public List<PurchaseItemResponseDTO> getAll(){
        return repository.findAll().stream().map(purchaseItem -> {
            PurchaseItemResponseDTO dto = new PurchaseItemResponseDTO();
            dto.setId(purchaseItem.getId());
            dto.setQuantity(purchaseItem.getQuantity());
            dto.setUnitPrice(purchaseItem.getUnitPrice());
            return dto;
        }).toList();
    }

    @GetMapping("/{id}")
    public PurchaseItemResponseDTO getPurchaseItemById(@PathVariable Long id){
        PurchaseItem purchaseItem = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.ITEM_COMPRA_NAO_ENCONTRADO));
        PurchaseItemResponseDTO dto = new PurchaseItemResponseDTO();
        dto.setId(purchaseItem.getId());
        dto.setQuantity(purchaseItem.getQuantity());
        dto.setUnitPrice(purchaseItem.getUnitPrice());
        return dto;
    }

    /** Exclusao de item de compra e privilegio de administrador (mesmo padrao de ProductController). */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void deletePurchaseItem(@PathVariable Long id) {
        PurchaseItem purchaseItem = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_COMPRA_NAO_ENCONTRADO));
        repository.delete(purchaseItem);
    }
}

