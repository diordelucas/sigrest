package br.com.sigrest.api.dto;

import br.com.sigrest.api.entity.User;
import jakarta.validation.constraints.NotBlank;

public record LoginDTO(@NotBlank(message = "informe o e-mail") String email, @NotBlank(message = "informe a senha") String password) {
    public LoginDTO (User user){
        this(user.getEmail(), user.getPassword());
    }
}
