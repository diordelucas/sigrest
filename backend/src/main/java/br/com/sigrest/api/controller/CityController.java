package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.CityRequestDTO;
import br.com.sigrest.api.dto.CityResponseDTO;
import br.com.sigrest.api.entity.City;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.CityRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("city")
public class CityController {

    @Autowired
    private CityRepository repository;

    @PostMapping
    public void saveCity(@Valid @RequestBody CityRequestDTO data){
        City cityData = new City();
        cityData.setName(data.name());
        cityData.setState(data.state());
        repository.save(cityData);
    }

    @GetMapping
    public List<CityResponseDTO> getAll(){
        List<CityResponseDTO> cityList = repository.findAll().stream().map(CityResponseDTO::new).toList();
        return cityList;
    }

    @GetMapping("/{id}")
    public CityResponseDTO getCityById(@PathVariable Long id){
        City city = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.CITY_NAO_ENCONTRADA));
        return new CityResponseDTO(city);
    }

    @PutMapping("/{id}")
    public CityResponseDTO updateCity(@PathVariable Long id, @Valid @RequestBody CityRequestDTO data) {
        City city = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.CITY_NAO_ENCONTRADA));
        city.setName(data.name());
        city.setState(data.state());
        
        repository.save(city);

        return new CityResponseDTO(city);
    }

    @DeleteMapping("/{id}")
    public void deleteCity(@PathVariable Long id) {
        City city = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CITY_NAO_ENCONTRADA));
        repository.delete(city);
    }
}

