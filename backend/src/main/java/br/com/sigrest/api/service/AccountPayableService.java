package br.com.sigrest.api.service;

import br.com.sigrest.api.dto.AccountPayableRequestDTO;
import br.com.sigrest.api.dto.AccountPayableResponseDTO;
import br.com.sigrest.api.dto.SupplierResponseDTO;
import br.com.sigrest.api.entity.AccountPayable;
import br.com.sigrest.api.entity.CashMovement;
import br.com.sigrest.api.entity.CashRegister;
import br.com.sigrest.api.entity.Supplier;
import br.com.sigrest.api.entity.User;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.AccountPayableRepository;
import br.com.sigrest.api.repository.CashMovementRepository;
import br.com.sigrest.api.repository.CashRegisterRepository;
import br.com.sigrest.api.repository.SupplierRepository;
import br.com.sigrest.api.service.audit.LogAtividadeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccountPayableService {

    @Autowired
    private AccountPayableRepository accountPayableRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private CashRegisterRepository cashRegisterRepository;

    @Autowired
    private CashMovementRepository cashMovementRepository;

    @Autowired
    private LogAtividadeService logAtividadeService;

    @Transactional
    public AccountPayableResponseDTO createAccountPayable(AccountPayableRequestDTO requestDTO) {
        Supplier supplier = supplierRepository.findById(requestDTO.getSupplierId())
                .orElseThrow(() -> new BusinessException(ErrorCode.SUPP_NAO_ENCONTRADO));

        AccountPayable accountPayable = new AccountPayable();
        accountPayable.setDescription(requestDTO.getDescription());
        accountPayable.setAmount(requestDTO.getAmount());
        accountPayable.setDueDate(requestDTO.getDueDate());
        accountPayable.setSupplier(supplier);
        accountPayable.setStatus(AccountPayable.Status.PENDING);

        AccountPayable savedAccount = accountPayableRepository.save(accountPayable);
        return convertToResponseDTO(savedAccount);
    }

    /**
     * Marca a conta como paga e lança a saída correspondente no caixa aberto — sem isso o
     * pagamento nunca aparecia no fluxo de caixa (ver PLANO_ACAO_COMPLETO.md, item 9).
     */
    @Transactional
    public AccountPayableResponseDTO payAccountPayable(Long id, User currentUser) {
        AccountPayable accountPayable = accountPayableRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAY_NAO_ENCONTRADA));

        if (accountPayable.getStatus() == AccountPayable.Status.PAID) {
            throw new BusinessException(ErrorCode.PAY_JA_PAGA);
        }

        CashRegister cashRegister = cashRegisterRepository.findByIsOpenTrue()
                .orElseThrow(() -> new BusinessException(ErrorCode.CASH_NAO_ABERTO,
                        "Abra o caixa antes de registrar o pagamento."));

        accountPayable.setPaymentDate(LocalDate.now());
        accountPayable.setStatus(AccountPayable.Status.PAID);
        AccountPayable updatedAccount = accountPayableRepository.save(accountPayable);

        CashMovement movement = new CashMovement();
        movement.setCashRegister(cashRegister);
        movement.setDate(LocalDateTime.now());
        movement.setType(CashMovement.MovementType.EXPENSE);
        movement.setAmount(accountPayable.getAmount());
        movement.setDescription("Pagamento: " + accountPayable.getDescription());
        movement.setUser(currentUser);
        cashMovementRepository.save(movement);

        logAtividadeService.registrar("PAGAR_CONTA", "AccountPayable", accountPayable.getId(),
                "Conta paga: " + accountPayable.getDescription(), currentUser);

        return convertToResponseDTO(updatedAccount);
    }

    @Transactional(readOnly = true)
    public List<AccountPayableResponseDTO> getAllAccountPayables() {
        return accountPayableRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AccountPayableResponseDTO getAccountPayableById(Long id) {
        AccountPayable accountPayable = accountPayableRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAY_NAO_ENCONTRADA));
        return convertToResponseDTO(accountPayable);
    }

    private AccountPayableResponseDTO convertToResponseDTO(AccountPayable accountPayable) {
        AccountPayableResponseDTO dto = new AccountPayableResponseDTO();
        dto.setId(accountPayable.getId());
        dto.setDescription(accountPayable.getDescription());
        dto.setAmount(accountPayable.getAmount());
        dto.setDueDate(accountPayable.getDueDate());
        dto.setPaymentDate(accountPayable.getPaymentDate());
        dto.setStatus(accountPayable.getStatus());
        if (accountPayable.getSupplier() != null) {
            dto.setSupplier(new SupplierResponseDTO(accountPayable.getSupplier()));
        }
        return dto;
    }
}

