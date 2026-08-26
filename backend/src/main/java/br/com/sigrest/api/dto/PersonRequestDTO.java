package br.com.sigrest.api.dto;

import br.com.sigrest.api.entity.Person;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PersonRequestDTO(
        Long id,
        @NotBlank(message = "informe o nome") String name,
        String cpf,
        String phone,
        @Email(message = "e-mail inválido") String email,
        String street, String number, String nbhd, String city, String uf
) {
    public PersonRequestDTO(Person person){
        this(
                person.getId(),
                person.getName(),
                person.getCpf(),
                person.getPhone(),
                person.getEmail(),
                person.getAddress() != null ? person.getAddress().getStreet() : null,
                person.getAddress() != null ? person.getAddress().getNumber() : null,
                person.getAddress() != null ? person.getAddress().getNbhd() : null,
                person.getAddress() != null && person.getAddress().getCity() != null ? person.getAddress().getCity().getName() : null,
                person.getAddress() != null && person.getAddress().getCity() != null && person.getAddress().getCity().getState() != null
                        ? person.getAddress().getCity().getState().getUf() : null
        );
    }
}
