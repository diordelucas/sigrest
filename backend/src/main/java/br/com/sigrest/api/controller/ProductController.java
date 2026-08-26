package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.ProductRequestDTO;
import br.com.sigrest.api.dto.ProductResponseDTO;
import br.com.sigrest.api.entity.Category;
import br.com.sigrest.api.entity.Product;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.CategoryRepository;
import br.com.sigrest.api.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("product")
public class ProductController {

    @Autowired
    private ProductRepository repository;

    @Autowired
    private CategoryRepository categoryRepository;

    /** Garante que a categoria foi informada e existe. Categoria é obrigatória no produto. */
    private void validateCategory(Long categoryId) {
        if (categoryId == null) {
            throw new BusinessException(ErrorCode.PROD_CATEGORIA_OBRIGATORIA);
        }
        if (!categoryRepository.existsById(categoryId)) {
            throw new BusinessException(ErrorCode.CAT_NAO_ENCONTRADA);
        }
    }

    @PostMapping
    public void saveProduct(@Valid @RequestBody ProductRequestDTO data){
        validateCategory(data.categoryId());
        Product productData = new Product(data);
        repository.save(productData);
        return;
    }

    @GetMapping
    public List<ProductResponseDTO> getAll(){
        List<ProductResponseDTO> productList = repository.findAll().stream()
                .filter(Product::isActive)
                .map(ProductResponseDTO::new).toList();
        return productList;
    }

    @GetMapping("/low-stock")
    public List<ProductResponseDTO> getLowStock(){
        List<ProductResponseDTO> lowStockList = repository.findLowStockProducts().stream().map(ProductResponseDTO::new).toList();
        return lowStockList;
    }

    @GetMapping("/{id}")
    public ProductResponseDTO getProductById(@PathVariable Long id){
        Product product = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.PROD_NAO_ENCONTRADO));
        return new ProductResponseDTO(product);
    }

    @PutMapping("/{id}")
    public ProductResponseDTO updatePerson(@PathVariable Long id, @Valid @RequestBody ProductRequestDTO data) {
        validateCategory(data.categoryId());

        Product product = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.PROD_NAO_ENCONTRADO));
        product.setName(data.name());
        product.setCode(data.code());
        product.setStorage(data.storage());
        product.setMinStorage(data.minStorage());
        product.setPrice(data.price());
        product.setSellPrice(data.sellPrice());
        product.setTipo(data.tipo());
        product.setPurchaseUnit(data.purchaseUnit());
        product.setPackageQuantity(data.packageQuantity());

        Category category = new Category();
        category.setId(data.categoryId());
        product.setCategory(category);

        Product updatedProduct = repository.save(product);

        return new ProductResponseDTO(updatedProduct);
    }

    /**
     * Exclusao de produto e privilegio de administrador (ver TCC, secao 5.1).
     * Nunca remove fisicamente: so desativa, preservando vendas, compras e
     * fichas tecnicas que ja referenciam este produto.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Long id) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROD_NAO_ENCONTRADO));
        product.setActive(false);
        repository.save(product);
    }
}
