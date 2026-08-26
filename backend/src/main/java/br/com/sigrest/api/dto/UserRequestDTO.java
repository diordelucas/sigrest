package br.com.sigrest.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserRequestDTO(
        @NotBlank(message = "informe o nome") String name,
        @NotBlank(message = "informe o e-mail") @Email(message = "e-mail inválido") String email,
        @NotBlank(message = "informe a senha") @Size(min = 6, message = "a senha deve ter ao menos 6 caracteres") String password,
        @NotBlank(message = "informe o perfil") String role
) {
}
