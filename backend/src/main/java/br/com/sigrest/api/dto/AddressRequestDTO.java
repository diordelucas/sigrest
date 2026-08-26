package br.com.sigrest.api.dto;

import br.com.sigrest.api.entity.Address;
import br.com.sigrest.api.entity.City;
import jakarta.validation.constraints.NotBlank;

public record AddressRequestDTO(Long id, @NotBlank(message = "informe a rua") String street, String number, String nbhd, City city) {
    public AddressRequestDTO(Address address){
        this(address.getId(), address.getStreet(), address.getNumber(), address.getNbhd(), address.getCity());
    }
}
