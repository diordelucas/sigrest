package br.com.sigrest.api.service;

import br.com.sigrest.api.dto.CostCalculationResponseDTO;
import br.com.sigrest.api.dto.TechnicalSheetItemRequestDTO;
import br.com.sigrest.api.dto.TechnicalSheetRequestDTO;
import br.com.sigrest.api.dto.TechnicalSheetResponseDTO;
import br.com.sigrest.api.entity.Product;
import br.com.sigrest.api.entity.TechnicalSheet;
import br.com.sigrest.api.entity.TechnicalSheetItem;
import br.com.sigrest.api.exception.BusinessException;
import br.com.sigrest.api.exception.ErrorCode;
import br.com.sigrest.api.repository.ProductRepository;
import br.com.sigrest.api.repository.TechnicalSheetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class TechnicalSheetService {

    @Autowired
    private TechnicalSheetRepository repository;

    @Autowired
    private ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<TechnicalSheetResponseDTO> findAll() {
        return repository.findAll().stream().map(TechnicalSheetResponseDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public TechnicalSheetResponseDTO getSheet(Long id) {
        return new TechnicalSheetResponseDTO(loadById(id));
    }

    private TechnicalSheet loadById(Long id) {
        return repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.TECH_FICHA_NAO_ENCONTRADA));
    }

    @Transactional
    public TechnicalSheetResponseDTO save(TechnicalSheetRequestDTO dto) {
        TechnicalSheet sheet = new TechnicalSheet();
        if (dto.id() != null) {
            sheet = loadById(dto.id());
        }

        sheet.setName(dto.name());
        sheet.setRendimento(dto.rendimento());
        sheet.setLabourCostPercent(dto.labourCostPercent());
        sheet.setVariableExpensesPercent(dto.variableExpensesPercent());
        sheet.setDesiredMarginPercent(dto.desiredMarginPercent());

        Product finalProduct = productRepository.findById(dto.finalProductId())
            .orElseThrow(() -> new BusinessException(ErrorCode.PROD_NAO_ENCONTRADO));
        sheet.setFinalProduct(finalProduct);

        if (sheet.getItems() == null) {
            sheet.setItems(new ArrayList<>());
        } else {
            sheet.getItems().clear();
        }

        if (dto.items() != null) {
            for (TechnicalSheetItemRequestDTO itemDto : dto.items()) {
                TechnicalSheetItem item = new TechnicalSheetItem();
                item.setTechnicalSheet(sheet);
                item.setRawMaterial(productRepository.findById(itemDto.rawMaterialId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PROD_NAO_ENCONTRADO, "Insumo não encontrado: " + itemDto.rawMaterialId())));
                item.setQuantity(itemDto.quantity());
                item.setUnit(itemDto.unit());
                sheet.getItems().add(item);
            }
        }

        return new TechnicalSheetResponseDTO(repository.save(sheet));
    }

    @Transactional
    public void delete(Long id) {
        TechnicalSheet sheet = loadById(id);
        repository.delete(sheet);
    }

    @Transactional(readOnly = true)
    public CostCalculationResponseDTO calculateCost(Long sheetId) {
        TechnicalSheet sheet = loadById(sheetId);

        List<CostCalculationResponseDTO.ItemCostDTO> itemCosts = new ArrayList<>();
        BigDecimal ingredientsTotalCost = BigDecimal.ZERO;

        if (sheet.getItems() != null) {
            for (TechnicalSheetItem item : sheet.getItems()) {
                Product mat = item.getRawMaterial();

                if (mat.getPurchaseUnit() == null
                        || mat.getPackageQuantity() == null
                        || mat.getPrice() == null
                        || mat.getPackageQuantity().compareTo(BigDecimal.ZERO) == 0) {
                    itemCosts.add(new CostCalculationResponseDTO.ItemCostDTO(
                            item.getId(), mat.getName(), item.getQuantity(),
                            item.getUnit() != null ? item.getUnit().name() : null,
                            BigDecimal.ZERO, BigDecimal.ZERO));
                    continue;
                }

                // Total base units in the purchase package (e.g. 5 KG → 5000 G)
                BigDecimal purchaseTotalBaseUnits = mat.getPackageQuantity()
                        .multiply(mat.getPurchaseUnit().getConversionFactor());

                // Cost per single base unit (e.g. R$25 / 5000 = R$0.005 per gram)
                BigDecimal costPerBaseUnit = mat.getPrice()
                        .divide(purchaseTotalBaseUnits, 10, RoundingMode.HALF_UP);

                // Convert recipe quantity to base units (e.g. 250 G → 250; null unit → factor 1)
                BigDecimal itemUnitFactor = item.getUnit() != null
                        ? item.getUnit().getConversionFactor()
                        : BigDecimal.ONE;
                BigDecimal itemBaseUnits = item.getQuantity().multiply(itemUnitFactor);

                BigDecimal itemCost = costPerBaseUnit
                        .multiply(itemBaseUnits)
                        .setScale(4, RoundingMode.HALF_UP);

                ingredientsTotalCost = ingredientsTotalCost.add(itemCost);

                itemCosts.add(new CostCalculationResponseDTO.ItemCostDTO(
                        item.getId(), mat.getName(), item.getQuantity(),
                        item.getUnit() != null ? item.getUnit().name() : null,
                        costPerBaseUnit.setScale(6, RoundingMode.HALF_UP),
                        itemCost));
            }
        }

        BigDecimal labour = sheet.getLabourCostPercent() != null ? sheet.getLabourCostPercent() : BigDecimal.ZERO;
        BigDecimal totalCostWithLabour = ingredientsTotalCost
                .multiply(BigDecimal.ONE.add(labour.divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP)))
                .setScale(4, RoundingMode.HALF_UP);

        BigDecimal varExp = sheet.getVariableExpensesPercent() != null ? sheet.getVariableExpensesPercent() : BigDecimal.ZERO;
        BigDecimal margin = sheet.getDesiredMarginPercent() != null ? sheet.getDesiredMarginPercent() : BigDecimal.ZERO;
        BigDecimal markupIndex = new BigDecimal("100")
                .subtract(varExp.add(margin))
                .divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP);

        BigDecimal suggestedSellPrice = BigDecimal.ZERO;
        if (markupIndex.compareTo(BigDecimal.ZERO) > 0) {
            suggestedSellPrice = totalCostWithLabour.divide(markupIndex, 2, RoundingMode.HALF_UP);
        }

        BigDecimal perServingCost = BigDecimal.ZERO;
        if (sheet.getRendimento() != null && sheet.getRendimento() > 0) {
            perServingCost = ingredientsTotalCost
                    .divide(new BigDecimal(sheet.getRendimento()), 4, RoundingMode.HALF_UP);
        }

        return new CostCalculationResponseDTO(
                sheet.getId(),
                sheet.getName(),
                itemCosts,
                ingredientsTotalCost.setScale(4, RoundingMode.HALF_UP),
                labour,
                varExp,
                margin,
                totalCostWithLabour,
                suggestedSellPrice,
                sheet.getRendimento(),
                perServingCost
        );
    }
}