package br.com.sigrest.api.service;

import br.com.sigrest.api.dto.AccountReceivableRequestDTO;
import br.com.sigrest.api.dto.AccountReceivableResponseDTO;
import br.com.sigrest.api.dto.PersonResponseDTO;
import br.com.sigrest.api.entity.AccountReceivable;
import br.com.sigrest.api.entity.Person;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.AccountReceivableRepository;
import br.com.sigrest.api.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccountReceivableService {

    @Autowired
    private AccountReceivableRepository accountReceivableRepository;

    @Autowired
    private PersonRepository personRepository;

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

    @Transactional
    public AccountReceivableResponseDTO receiveAccountReceivable(Long id) {
        AccountReceivable accountReceivable = accountReceivableRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.REC_NAO_ENCONTRADA));

        if (accountReceivable.getStatus() == AccountReceivable.Status.RECEIVED) {
            throw new BusinessException(ErrorCode.REC_JA_RECEBIDA);
        }

        accountReceivable.setReceiptDate(LocalDate.now());
        accountReceivable.setStatus(AccountReceivable.Status.RECEIVED);

        AccountReceivable updatedAccount = accountReceivableRepository.save(accountReceivable);
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

