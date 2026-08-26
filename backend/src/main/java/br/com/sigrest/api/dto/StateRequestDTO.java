package br.com.sigrest.api.dto;

import br.com.sigrest.api.entity.State;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StateRequestDTO(
        Long id,
        @NotBlank(message = "informe o nome do estado") String name,
        @NotBlank(message = "informe a UF") @Size(min = 2, max = 2, message = "UF deve ter 2 letras") String uf
) {
    public StateRequestDTO(State state){
        this(state.getId(), state.getName(), state.getUf());
    }
}
