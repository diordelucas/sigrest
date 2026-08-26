package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.AddressRequestDTO;
import br.com.sigrest.api.dto.AddressResponseDTO;
import br.com.sigrest.api.entity.Address;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.AddressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("address")
public class AddressController {

    @Autowired
    private AddressRepository repository;

    @PostMapping
    public void saveAddres(@RequestBody AddressRequestDTO data){
        Address addressData = new Address();
        addressData.setStreet(data.street());
        addressData.setNumber(data.number());
        addressData.setNbhd(data.nbhd());
        addressData.setCity(data.city());
        repository.save(addressData);
    }

    @GetMapping
    public List<AddressResponseDTO> getAll(){
        List<AddressResponseDTO> addressList = repository.findAll().stream().map(AddressResponseDTO::new).toList();
        return addressList;
    }

    @GetMapping("/{id}")
    public AddressResponseDTO getAddressById(@PathVariable Long id){
        Address address = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NAO_ENCONTRADO));
        return new AddressResponseDTO(address);
    }

    @PutMapping("/{id}")
    public AddressResponseDTO updateAddress(@PathVariable Long id, @RequestBody AddressRequestDTO data) {
        Address address = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NAO_ENCONTRADO));
        address.setStreet(data.street());
        address.setNumber(data.number());
        address.setNbhd(data.nbhd());
        address.setCity(data.city());
        
        repository.save(address);

        return new AddressResponseDTO(address);
    }

    @DeleteMapping("/{id}")
    public void deleteAddress(@PathVariable Long id) {
        Address address = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NAO_ENCONTRADO));
        repository.delete(address);
    }
}

