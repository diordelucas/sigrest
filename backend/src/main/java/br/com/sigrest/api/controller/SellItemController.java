package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.SellItemRequestDTO;
import br.com.sigrest.api.dto.SellItemResponseDTO;
import br.com.sigrest.api.entity.SellItem;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.SellItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("sell_item")
public class SellItemController {

    @Autowired
    private SellItemRepository repository;

    @PostMapping
    public void saveSellItem(@RequestBody SellItemRequestDTO data){
        SellItem sellItemData = new SellItem(data);
        repository.save(sellItemData);
        return;
    }

    @GetMapping
    public List<SellItemResponseDTO> getAll(){

        List<SellItemResponseDTO> sellItemList = repository.findAll().stream().map(SellItemResponseDTO::new).toList();
            return sellItemList;
        }

    @GetMapping("/{id}")
    public SellItemResponseDTO getSellItemById(@PathVariable Long id){
        SellItem sellItem = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.ITEM_VENDA_NAO_ENCONTRADO));
        return new SellItemResponseDTO(sellItem);
    }

    @PutMapping("/{id}")
    public SellItemResponseDTO updateSellItem(@PathVariable Long id, @RequestBody SellItemRequestDTO data) {
        SellItem sellItem = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.ITEM_VENDA_NAO_ENCONTRADO));
        sellItem.setQuantity(data.quantity());
        sellItem.setUnitPrice(data.unitPrice());

        return new SellItemResponseDTO(sellItem);
    }

    /** Exclusao de item de venda e privilegio de administrador (mesmo padrao de ProductController). */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void deleteSellItem(@PathVariable Long id) {
        SellItem sellItem = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_VENDA_NAO_ENCONTRADO));
        repository.delete(sellItem);
    }

    }

