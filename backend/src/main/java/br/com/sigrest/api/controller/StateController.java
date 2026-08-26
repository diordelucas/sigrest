package br.com.sigrest.api.controller;

import br.com.sigrest.api.dto.StateRequestDTO;
import br.com.sigrest.api.dto.StateResponseDTO;
import br.com.sigrest.api.entity.State;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.StateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("state")
public class StateController {

    @Autowired
    private StateRepository repository;

    @PostMapping
    public void saveState(@RequestBody StateRequestDTO data){
        State stateData = new State();
        stateData.setName(data.name());
        stateData.setUf(data.uf());
        repository.save(stateData);
    }

    @GetMapping
    public List<StateResponseDTO> getAll(){
        List<StateResponseDTO> stateList = repository.findAll().stream().map(StateResponseDTO::new).toList();
        return stateList;
    }

    @GetMapping("/{id}")
    public StateResponseDTO getStateById(@PathVariable Long id){
        State state = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.STATE_NAO_ENCONTRADO));
        return new StateResponseDTO(state);
    }

    @PutMapping("/{id}")
    public StateResponseDTO updateState(@PathVariable Long id, @RequestBody StateRequestDTO data) {
        State state = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.STATE_NAO_ENCONTRADO));
        state.setName(data.name());
        state.setUf(data.uf());
        
        repository.save(state);

        return new StateResponseDTO(state);
    }

    @DeleteMapping("/{id}")
    public void deleteState(@PathVariable Long id) {
        State state = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.STATE_NAO_ENCONTRADO));
        repository.delete(state);
    }
}

