package br.com.sigrest.api.dto;

import br.com.sigrest.api.entity.Category;
import jakarta.validation.constraints.NotBlank;

public record CategoryRequestDTO(Long id, @NotBlank(message = "informe o nome da categoria") String name, String description) {
    public CategoryRequestDTO(Category category) {
        this(category.getId(), category.getName(), category.getDescription());
    }
}
