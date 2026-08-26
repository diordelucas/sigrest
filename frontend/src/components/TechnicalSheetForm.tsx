import React, { useState, useEffect, FormEvent } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Calculator } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { Product, TechnicalSheet, CostCalculation } from '../types';
import Button from './ui/Button';
import Field from './ui/Field';
import { Table, Th } from './ui/Table';

const UDM_OPTIONS = [
  { value: 'G', label: 'G' },
  { value: 'KG', label: 'KG' },
  { value: 'ML', label: 'ML' },
  { value: 'L', label: 'L' },
  { value: 'UN', label: 'UN' },
  { value: 'DUZIA', label: 'DZ' },
];

const formatBRL = (value: number | string): string => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '0,00';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

interface TechnicalSheetItemForm {
  rawMaterialId: string;
  quantity: string;
  unit: string;
}

interface TechnicalSheetFormProps {
  sheetToEdit?: TechnicalSheet | null;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

const TechnicalSheetForm = ({ sheetToEdit, onSaveSuccess, onCancel }: TechnicalSheetFormProps) => {
  const [name, setName] = useState('');
  const [finalProductId, setFinalProductId] = useState('');
  const [items, setItems] = useState<TechnicalSheetItemForm[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rendimento, setRendimento] = useState('');
  const [labourCostPercent, setLabourCostPercent] = useState('');
  const [variableExpensesPercent, setVariableExpensesPercent] = useState('');
  const [desiredMarginPercent, setDesiredMarginPercent] = useState('');
  const [costResult, setCostResult] = useState<CostCalculation | null>(null);
  const [calculatingCost, setCalculatingCost] = useState(false);

  useEffect(() => {
    fetchProducts();
    if (sheetToEdit) {
      setName(sheetToEdit.name || '');
      setFinalProductId(String(sheetToEdit.finalProduct?.id || ''));
      setRendimento(String(sheetToEdit.rendimento ?? ''));
      setLabourCostPercent(String(sheetToEdit.labourCostPercent ?? ''));
      setVariableExpensesPercent(String(sheetToEdit.variableExpensesPercent ?? ''));
      setDesiredMarginPercent(String(sheetToEdit.desiredMarginPercent ?? ''));
      setItems(
        sheetToEdit.items
          ? sheetToEdit.items.map((i) => ({
              rawMaterialId: String(i.rawMaterial?.id || ''),
              quantity: String(i.quantity ?? ''),
              unit: i.unit || '',
            }))
          : []
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetToEdit]);

  const fetchProducts = async () => {
    try {
      const response = await api.get<Product[]>('/product');
      setProducts(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar lista de produtos.'));
    }
  };

  const fetchCostPreview = async () => {
    if (!sheetToEdit?.id) return;
    setCalculatingCost(true);
    try {
      const res = await api.get<CostCalculation>(`/technical-sheet/${sheetToEdit.id}/calculate-cost`);
      setCostResult(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao calcular custos. Verifique se os insumos têm UDM e preço de custo cadastrados.'));
    } finally {
      setCalculatingCost(false);
    }
  };

  const addItem = () => {
    setItems([...items, { rawMaterialId: '', quantity: '', unit: '' }]);
  };

  const updateItem = (index: number, field: keyof TechnicalSheetItemForm, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!finalProductId) {
      setError('Selecione o Produto Final.');
      setLoading(false);
      return;
    }
    if (items.length === 0) {
      setError('Adicione pelo menos um insumo na ficha técnica.');
      setLoading(false);
      return;
    }

    const seenIngredients = new Set<string>();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.rawMaterialId) {
        setError(`Selecione o insumo na linha ${i + 1}.`);
        setLoading(false);
        return;
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        setError(`A quantidade do insumo na linha ${i + 1} deve ser maior que zero.`);
        setLoading(false);
        return;
      }
      if (String(item.rawMaterialId) === String(finalProductId)) {
        setError(`O insumo na linha ${i + 1} não pode ser igual ao produto final.`);
        setLoading(false);
        return;
      }
      if (seenIngredients.has(item.rawMaterialId)) {
        setError(`O insumo na linha ${i + 1} está duplicado.`);
        setLoading(false);
        return;
      }
      seenIngredients.add(item.rawMaterialId);
    }

    const data = {
      name,
      finalProductId,
      rendimento: rendimento !== '' ? parseInt(rendimento, 10) : null,
      labourCostPercent: labourCostPercent !== '' ? parseFloat(labourCostPercent) : null,
      variableExpensesPercent: variableExpensesPercent !== '' ? parseFloat(variableExpensesPercent) : null,
      desiredMarginPercent: desiredMarginPercent !== '' ? parseFloat(desiredMarginPercent) : null,
      items: items.map((i) => ({
        rawMaterialId: i.rawMaterialId,
        quantity: parseFloat(i.quantity),
        unit: i.unit || null,
      })),
    };

    try {
      if (sheetToEdit?.id) {
        await api.put(`/technical-sheet/${sheetToEdit.id}`, data);
      } else {
        await api.post('/technical-sheet', data);
      }
      onSaveSuccess();
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar ficha técnica. Verifique se o produto final já possui uma ficha cadastrada.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          className="p-2 border border-line text-ink-muted rounded-lg hover:bg-surface-2 transition-colors"
          onClick={onCancel}
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-lg font-semibold text-ink">
          {sheetToEdit ? 'Editar Ficha Técnica' : 'Nova Ficha Técnica'}
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Nome da Receita / Ficha
            </label>
            <Field
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nome da receita"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Produto Final (Marmita / Acabado)
            </label>
            <Field
              as="select"
              value={finalProductId}
              onChange={(e) => setFinalProductId(e.target.value)}
              required
            >
              <option value="">Selecione o produto final...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Field>
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Rendimento (Porções)
            </label>
            <Field
              type="number"
              min="1"
              value={rendimento}
              onChange={(e) => setRendimento(e.target.value)}
              placeholder="Ex: 10"
            />
            <p className="text-xs text-ink-muted mt-1">Quantas porções esta receita produz.</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wider">Insumos / Ingredientes</h3>
          <Button type="button" variant="secondary" onClick={addItem}>
            <Plus size={14} /> Adicionar Insumo
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="border-2 border-dashed border-line rounded-xl p-8 text-center mb-4">
            <p className="text-ink-muted text-sm">
              Nenhum ingrediente adicionado. Clique em "Adicionar Insumo" para começar.
            </p>
          </div>
        ) : (
          <Table className="mb-4">
              <thead className="bg-surface-2 border-b border-line">
                <tr>
                  <Th>Insumo / Ingrediente</Th>
                  <Th className="w-[230px]">Qtde / UDM</Th>
                  <Th className="text-center w-[80px]">Ações</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      <Field
                        as="select"
                        value={item.rawMaterialId}
                        onChange={(e) => updateItem(index, 'rawMaterialId', e.target.value)}
                        required
                      >
                        <option value="">Selecione o insumo...</option>
                        {products
                          .filter((p) => String(p.id) !== String(finalProductId))
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                              {p.purchaseUnit ? ` (${p.purchaseUnit})` : ''}
                            </option>
                          ))}
                      </Field>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Field
                          type="number"
                          step="any"
                          min="0"
                          className="w-[110px]"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          placeholder="Ex: 250"
                          required
                        />
                        <Field
                          as="select"
                          className="w-[80px]"
                          value={item.unit}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        >
                          <option value="">—</option>
                          {UDM_OPTIONS.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.label}
                            </option>
                          ))}
                        </Field>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                        onClick={() => removeItem(index)}
                        title="Remover Insumo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
          </Table>
        )}

        <div className="border-t border-line my-6" />
        <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-3">Precificação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Custo de Mão de Obra (%)
            </label>
            <Field
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={labourCostPercent}
              onChange={(e) => setLabourCostPercent(e.target.value)}
              placeholder="Ex: 30"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Despesas Variáveis (%)
            </label>
            <Field
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={variableExpensesPercent}
              onChange={(e) => setVariableExpensesPercent(e.target.value)}
              placeholder="Ex: 10"
            />
            <p className="text-xs text-ink-muted mt-1">Impostos, taxas de cartão, etc.</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Margem Desejada (%)
            </label>
            <Field
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={desiredMarginPercent}
              onChange={(e) => setDesiredMarginPercent(e.target.value)}
              placeholder="Ex: 20"
            />
          </div>
        </div>

        {sheetToEdit?.id && (
          <div className="border border-line rounded-xl p-4 bg-surface-2 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Calculator size={14} />
                Prévia de Custos (dados salvos)
              </h3>
              <button
                type="button"
                onClick={fetchCostPreview}
                disabled={calculatingCost}
                className="px-3 py-1.5 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Calculator size={12} />
                {calculatingCost ? 'Calculando...' : 'Calcular Custos'}
              </button>
            </div>

            {!costResult && (
              <p className="text-xs text-ink-muted text-center py-4">
                Salve a ficha e clique em "Calcular Custos" para ver a composição de custo e o preço sugerido de venda.
              </p>
            )}

            {costResult && (
              <>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-ink-muted uppercase border-b border-line">
                        <th className="pb-2">Insumo</th>
                        <th className="pb-2 text-right">Qtde</th>
                        <th className="pb-2">UDM</th>
                        <th className="pb-2 text-right">Custo/base</th>
                        <th className="pb-2 text-right">Custo Item</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {costResult.itemCosts.map((ic) => (
                        <tr key={ic.itemId}>
                          <td className="py-1.5 pr-2 text-ink">{ic.rawMaterialName}</td>
                          <td className="py-1.5 pr-2 text-right text-ink-muted">{ic.quantity}</td>
                          <td className="py-1.5 pr-2 text-ink-muted">{ic.unit || '—'}</td>
                          <td className="py-1.5 pr-2 text-right text-ink-muted font-mono text-xs">
                            R$ {Number(ic.costPerBaseUnit).toFixed(6)}
                          </td>
                          <td className="py-1.5 text-right font-semibold text-ink">R$ {formatBRL(ic.itemCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-line">
                  <div className="p-2 bg-surface rounded-lg border border-line">
                    <p className="text-xs text-ink-muted mb-0.5">Custo Ingredientes</p>
                    <p className="font-semibold text-ink text-sm">R$ {formatBRL(costResult.ingredientsTotalCost)}</p>
                  </div>
                  <div className="p-2 bg-surface rounded-lg border border-line">
                    <p className="text-xs text-ink-muted mb-0.5">Custo c/ Mão de Obra</p>
                    <p className="font-semibold text-ink text-sm">R$ {formatBRL(costResult.totalCostWithLabour)}</p>
                  </div>
                  <div className="p-2 bg-surface rounded-lg border border-line">
                    <p className="text-xs text-ink-muted mb-0.5">Custo por Porção</p>
                    <p className="font-semibold text-ink text-sm">
                      {costResult.rendimento && costResult.perServingCost != null
                        ? `R$ ${formatBRL(costResult.perServingCost)}`
                        : '—'}
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-semibold mb-0.5">Preço Sugerido de Venda</p>
                    <p className="font-extrabold text-emerald-700 text-lg">
                      R$ {formatBRL(costResult.suggestedSellPrice)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            <Save size={14} />
            {loading ? 'Salvando...' : 'Salvar Ficha Técnica'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TechnicalSheetForm;
