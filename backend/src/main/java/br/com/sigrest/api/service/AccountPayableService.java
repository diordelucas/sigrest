package br.com.sigrest.api.service;

import br.com.sigrest.api.dto.AccountPayableRequestDTO;
import br.com.sigrest.api.dto.AccountPayableResponseDTO;
import br.com.sigrest.api.dto.SupplierResponseDTO;
import br.com.sigrest.api.entity.AccountPayable;
import br.com.sigrest.api.entity.Supplier;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.AccountPayableRepository;
import br.com.sigrest.api.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccountPayableService {

    @Autowired
    private AccountPayableRepository accountPayableRepository;

    @Autowired
    private SupplierRepository supplierRepository;

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

    @Transactional
    public AccountPayableResponseDTO payAccountPayable(Long id) {
        AccountPayable accountPayable = accountPayableRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAY_NAO_ENCONTRADA));

        if (accountPayable.getStatus() == AccountPayable.Status.PAID) {
            throw new BusinessException(ErrorCode.PAY_JA_PAGA);
        }

        accountPayable.setPaymentDate(LocalDate.now());
        accountPayable.setStatus(AccountPayable.Status.PAID);

        AccountPayable updatedAccount = accountPayableRepository.save(accountPayable);
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

