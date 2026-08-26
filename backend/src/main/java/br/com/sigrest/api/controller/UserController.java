package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.LoginDTO;
import br.com.sigrest.api.dto.LoginResponseDTO;
import br.com.sigrest.api.dto.UserRequestDTO;
import br.com.sigrest.api.dto.UserResponseDTO;
import br.com.sigrest.api.entity.User;
import br.com.sigrest.api.security.LoginRateLimiter;
import br.com.sigrest.api.security.TokenService;
import br.com.sigrest.api.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private LoginRateLimiter rateLimiter;

    /** Criacao de usuario e privilegio de administrador — nao e mais um cadastro publico. */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/signup")
    public ResponseEntity<UserResponseDTO> signup(@Valid @RequestBody UserRequestDTO dto){
        User user = new User();
        user.setName(dto.name());
        user.setEmail(dto.email());
        user.setPassword(dto.password());
        user.setRole(dto.role());
        return ResponseEntity.ok(new UserResponseDTO(userService.signUp(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginDTO loginDTO, HttpServletRequest request){
        String key = rateLimiter.key(request.getRemoteAddr(), loginDTO.email());
        rateLimiter.checkBlocked(key);
        try {
            User user = userService.login(loginDTO.email(), loginDTO.password());
            rateLimiter.registerSuccess(key);
            String token = tokenService.generate(user);
            return ResponseEntity.ok(new LoginResponseDTO(token, user.getName(), user.getEmail(), user.getRole()));
        } catch (RuntimeException ex) {
            rateLimiter.registerFailure(key);
            throw ex;
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<UserResponseDTO> getAll(){
        return userService.getAll().stream().map(UserResponseDTO::new).collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
