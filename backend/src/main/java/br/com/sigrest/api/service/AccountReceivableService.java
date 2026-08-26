package br.com.sigrest.api.service;

import br.com.sigrest.api.dto.AccountReceivableRequestDTO;
import br.com.sigrest.api.dto.AccountReceivableResponseDTO;
import br.com.sigrest.api.dto.PersonResponseDTO;
import br.com.sigrest.api.entity.AccountReceivable;
import br.com.sigrest.api.entity.CashMovement;
import br.com.sigrest.api.entity.CashRegister;
import br.com.sigrest.api.entity.Person;
import br.com.sigrest.api.entity.User;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.AccountReceivableRepository;
import br.com.sigrest.api.repository.CashMovementRepository;
import br.com.sigrest.api.repository.CashRegisterRepository;
import br.com.sigrest.api.repository.PersonRepository;
import br.com.sigrest.api.service.audit.LogAtividadeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccountReceivableService {

    @Autowired
    private AccountReceivableRepository accountReceivableRepository;

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private CashRegisterRepository cashRegisterRepository;

    @Autowired
    private CashMovementRepository cashMovementRepository;

    @Autowired
    private LogAtividadeService logAtividadeService;

    @Transactional
    public AccountReceivableResponseDTO createAccountReceivable(AccountReceivableRequestDTO requestDTO) {
        Person person = personRepository.findById(requestDTO.getPersonId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PERSON_NAO_ENCONTRADA));

        AccountReceivable accountReceivable = new AccountReceivable();
        accountReceivable.setDescription(requestDTO.getDescription());
        accountReceivable.setAmount(requestDTO.getAmount());
        accountReceivable.setDueDate(requestDTO.getDueDate());
        accountReceivable.setPerson(person);
        accountReceivable.setStatus(AccountReceivable.Status.PENDING);

        AccountReceivable savedAccount = accountReceivableRepository.save(accountReceivable);
        return convertToResponseDTO(savedAccount);
    }

    /**
     * Marca a conta como recebida e lança a entrada correspondente no caixa aberto — sem isso o
     * recebimento nunca aparecia no fluxo de caixa (ver PLANO_ACAO_COMPLETO.md, item 9).
     */
    @Transactional
    public AccountReceivableResponseDTO receiveAccountReceivable(Long id, User currentUser) {
        AccountReceivable accountReceivable = accountReceivableRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.REC_NAO_ENCONTRADA));

        if (accountReceivable.getStatus() == AccountReceivable.Status.RECEIVED) {
            throw new BusinessException(ErrorCode.REC_JA_RECEBIDA);
        }

        CashRegister cashRegister = cashRegisterRepository.findByIsOpenTrue()
                .orElseThrow(() -> new BusinessException(ErrorCode.CASH_NAO_ABERTO,
                        "Abra o caixa antes de registrar o recebimento."));

        accountReceivable.setReceiptDate(LocalDate.now());
        accountReceivable.setStatus(AccountReceivable.Status.RECEIVED);
        AccountReceivable updatedAccount = accountReceivableRepository.save(accountReceivable);

        CashMovement movement = new CashMovement();
        movement.setCashRegister(cashRegister);
        movement.setDate(LocalDateTime.now());
        movement.setType(CashMovement.MovementType.INCOME);
        movement.setAmount(accountReceivable.getAmount());
        movement.setDescription("Recebimento: " + accountReceivable.getDescription());
        movement.setUser(currentUser);
        cashMovementRepository.save(movement);

        logAtividadeService.registrar("RECEBER_CONTA", "AccountReceivable", accountReceivable.getId(),
                "Conta recebida: " + accountReceivable.getDescription(), currentUser);

        return convertToResponseDTO(updatedAccount);
    }

    @Transactional(readOnly = true)
    public List<AccountReceivableResponseDTO> getAllAccountReceivables() {
        return accountReceivableRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AccountReceivableResponseDTO getAccountReceivableById(Long id) {
        AccountReceivable accountReceivable = accountReceivableRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.REC_NAO_ENCONTRADA));
        return convertToResponseDTO(accountReceivable);
    }

    private AccountReceivableResponseDTO convertToResponseDTO(AccountReceivable accountReceivable) {
        AccountReceivableResponseDTO dto = new AccountReceivableResponseDTO();
        dto.setId(accountReceivable.getId());
        dto.setDescription(accountReceivable.getDescription());
        dto.setAmount(accountReceivable.getAmount());
        dto.setDueDate(accountReceivable.getDueDate());
        dto.setReceiptDate(accountReceivable.getReceiptDate());
        dto.setStatus(accountReceivable.getStatus());
        if (accountReceivable.getPerson() != null) {
            dto.setPerson(new PersonResponseDTO(accountReceivable.getPerson()));
        }
        return dto;
    }
}

