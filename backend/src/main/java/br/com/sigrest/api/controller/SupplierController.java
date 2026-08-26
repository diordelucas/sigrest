package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.SupplierRequestDTO;
import br.com.sigrest.api.dto.SupplierResponseDTO;
import br.com.sigrest.api.entity.Address;
import br.com.sigrest.api.entity.City;
import br.com.sigrest.api.entity.State;
import br.com.sigrest.api.entity.Supplier;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("supplier")
public class SupplierController {

    @Autowired
    private SupplierRepository repository;

    @PostMapping
    public void saveSupplier(@RequestBody SupplierRequestDTO data) {
        Supplier supplier = new Supplier(data);

        if (data.street() != null || data.city() != null || data.uf() != null) {
            State state = new State();
            state.setUf(data.uf());

            City city = new City();
            city.setName(data.city());
            city.setState(state);

            Address address = new Address();
            address.setStreet(data.street());
            address.setNumber(data.number());
            address.setNbhd(data.nbhd());
            address.setCity(city);

            supplier.setAddress(address);
        }

        repository.save(supplier);
    }

    @GetMapping
    public List<SupplierResponseDTO> getAll() {
        return repository.findAll().stream().filter(Supplier::isActive).map(SupplierResponseDTO::new).toList();
    }

    @GetMapping("/{id}")
    public SupplierResponseDTO getSupplierById(@PathVariable Long id) {
        Supplier supplier = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SUPP_NAO_ENCONTRADO));
        return new SupplierResponseDTO(supplier);
    }

    @PutMapping("/{id}")
    public SupplierResponseDTO updateSupplier(@PathVariable Long id, @RequestBody SupplierRequestDTO data) {
        Supplier supplier = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SUPP_NAO_ENCONTRADO));

        supplier.setName(data.name());
        supplier.setCnpj(data.cnpj());
        supplier.setRegistration(data.registration());
        supplier.setPhone(data.phone());
        supplier.setEmail(data.email());

        Address address = supplier.getAddress();
        if (address == null) address = new Address();
        address.setStreet(data.street());
        address.setNumber(data.number());
        address.setNbhd(data.nbhd());

        City city = address.getCity();
        if (city == null) city = new City();
        city.setName(data.city());

        State state = city.getState();
        if (state == null) state = new State();
        state.setUf(data.uf());

        city.setState(state);
        address.setCity(city);
        supplier.setAddress(address);

        return new SupplierResponseDTO(repository.save(supplier));
    }

    /** Nunca remove fisicamente: so desativa, preservando o historico de compras deste fornecedor. */
    @DeleteMapping("/{id}")
    public void deleteSupplier(@PathVariable Long id) {
        Supplier supplier = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SUPP_NAO_ENCONTRADO));
        supplier.setActive(false);
        repository.save(supplier);
    }
}