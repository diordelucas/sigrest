package br.com.sigrest.api.service;

import br.com.sigrest.api.dto.CashMovementRequestDTO;
import br.com.sigrest.api.dto.CashMovementResponseDTO;
import br.com.sigrest.api.dto.UserResponseDTO;
import br.com.sigrest.api.entity.CashMovement;
import br.com.sigrest.api.entity.CashRegister;
import br.com.sigrest.api.entity.User;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.CashMovementRepository;
import br.com.sigrest.api.repository.CashRegisterRepository;
import br.com.sigrest.api.repository.UserRepository;
import br.com.sigrest.api.service.audit.LogAtividadeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CashMovementService {

    @Autowired
    private CashMovementRepository cashMovementRepository;

    @Autowired
    private CashRegisterRepository cashRegisterRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LogAtividadeService logAtividadeService;

    @Transactional
    public CashMovementResponseDTO createCashMovement(CashMovementRequestDTO requestDTO) {
        CashRegister cashRegister = cashRegisterRepository.findById(requestDTO.getCashRegisterId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CASH_NAO_ENCONTRADO));

        if (!cashRegister.isOpen()) {
            throw new BusinessException(ErrorCode.CASH_NAO_ABERTO);
        }

        User user = userRepository.findById(requestDTO.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NAO_ENCONTRADO));

        CashMovement cashMovement = new CashMovement();
        cashMovement.setCashRegister(cashRegister);
        cashMovement.setDate(LocalDateTime.now());
        cashMovement.setType(requestDTO.getType());
        cashMovement.setAmount(requestDTO.getAmount());
        cashMovement.setDescription(requestDTO.getDescription());
        cashMovement.setUser(user);

        CashMovement savedMovement = cashMovementRepository.save(cashMovement);
        logAtividadeService.registrar(
                requestDTO.getType() == CashMovement.MovementType.INCOME ? "MOVIMENTO_CAIXA_ENTRADA" : "MOVIMENTO_CAIXA_SAIDA",
                "CashMovement", savedMovement.getId(),
                requestDTO.getDescription(), user);
        return convertToResponseDTO(savedMovement);
    }

    public List<CashMovementResponseDTO> getMovementsByCashRegister(Long cashRegisterId) {
        return cashMovementRepository.findByCashRegisterId(cashRegisterId).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    public BigDecimal getTotalMovementsForCashRegister(Long cashRegisterId) {
        return cashMovementRepository.findByCashRegisterId(cashRegisterId).stream()
                .map(movement -> movement.getType() == CashMovement.MovementType.INCOME ? movement.getAmount() : movement.getAmount().negate())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private CashMovementResponseDTO convertToResponseDTO(CashMovement cashMovement) {
        CashMovementResponseDTO dto = new CashMovementResponseDTO();
        dto.setId(cashMovement.getId());
        dto.setCashRegisterId(cashMovement.getCashRegister().getId());
        dto.setDate(cashMovement.getDate());
        dto.setType(cashMovement.getType());
        dto.setAmount(cashMovement.getAmount());
        dto.setDescription(cashMovement.getDescription());
        if (cashMovement.getUser() != null) {
            dto.setUser(new UserResponseDTO(cashMovement.getUser().getId(), cashMovement.getUser().getName(), cashMovement.getUser().getEmail(), cashMovement.getUser().getRole()));
        }
        return dto;
    }
}

