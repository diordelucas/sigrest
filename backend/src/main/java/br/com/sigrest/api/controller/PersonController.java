package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.PersonRequestDTO;
import br.com.sigrest.api.dto.PersonResponseDTO;
import br.com.sigrest.api.entity.Address;
import br.com.sigrest.api.entity.City;
import br.com.sigrest.api.entity.Person;
import br.com.sigrest.api.entity.State;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.PersonRepository;
import br.com.sigrest.api.util.Documentos;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("person")
public class PersonController {

    @Autowired
    private PersonRepository repository;

    /** CPF e opcional; quando informado, o digito verificador precisa ser valido. */
    private void validateCpf(String cpf) {
        if (cpf != null && !cpf.isBlank() && !Documentos.isValidCPF(cpf)) {
            throw new BusinessException(ErrorCode.PERSON_CPF_INVALIDO);
        }
    }

    @PostMapping
    public void savePerson(@Valid @RequestBody PersonRequestDTO data){
        validateCpf(data.cpf());
        Person personData = new Person(data);

        // Criar e associar o endereÃ§o se os dados estiverem presentes
        if (data.street() != null || data.number() != null || data.nbhd() != null ||
                data.city() != null || data.uf() != null) {

            // Criar State
            State state = new State();
            state.setUf(data.uf());

            // Criar City
            City city = new City();
            city.setName(data.city());
            city.setState(state);

            // Criar Address
            Address address = new Address();
            address.setStreet(data.street());
            address.setNumber(data.number());
            address.setNbhd(data.nbhd());
            address.setCity(city);

            // Associar endereÃ§o Ã  pessoa
            personData.setAddress(address);
        }

        repository.save(personData);
    }

    @GetMapping("/{id}")
    public PersonResponseDTO getPersonById(@PathVariable Long id){
        Person person = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.PERSON_NAO_ENCONTRADA));
        return new PersonResponseDTO(person);
    }

    @GetMapping
    public List<PersonResponseDTO> getAll(){

        List<PersonResponseDTO> personList = repository.findAll().stream()
                .filter(Person::isActive)
                .map(PersonResponseDTO::new).toList();
            return personList;
        }

    @PutMapping("/{id}")
    public PersonResponseDTO updatePerson(@PathVariable Long id, @Valid @RequestBody PersonRequestDTO data) {
        validateCpf(data.cpf());
        Person person = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.PERSON_NAO_ENCONTRADA));
        person.setName(data.name());
        person.setCpf(data.cpf());
        person.setEmail(data.email());
        person.setPhone(data.phone());

        Address address = person.getAddress();
        if (address == null) {
            address = new Address();
        }
        address.setStreet(data.street());
        address.setNumber(data.number());
        address.setNbhd(data.nbhd());

        City city = address.getCity();
        if (city == null) {
            city = new City();
        }
        city.setName(data.city());

        State state = city.getState();
        if (state == null) {
            state = new State();
        }
        state.setUf(data.uf());

        city.setState(state);
        address.setCity(city);
        person.setAddress(address);

        person = repository.save(person);

        return new PersonResponseDTO(person);
    }

    /** Nunca remove fisicamente: so desativa, preservando o historico de vendas deste cliente. */
    @DeleteMapping("/{id}")
    public void deletePerson(@PathVariable Long id) {
        Person person = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PERSON_NAO_ENCONTRADA));
        person.setActive(false);
        repository.save(person);
    }

    }

