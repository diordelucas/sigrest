package br.com.sigrest.api.dto;

import br.com.sigrest.api.entity.City;
import br.com.sigrest.api.entity.State;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CityRequestDTO(Long id, @NotBlank(message = "informe o nome da cidade") String name, @NotNull(message = "informe o estado") State state) {
    public CityRequestDTO(City city){
        this(city.getId(), city.getName(), city.getState());
    }
}
