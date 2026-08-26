import React, { useState, useEffect, FormEvent } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { TechnicalSheet } from '../types';
import Button from './ui/Button';
import Field from './ui/Field';

interface ProductionOrderFormProps {
  onSaveSuccess: () => void;
  onCancel: () => void;
}

const ProductionOrderForm = ({ onSaveSuccess, onCancel }: ProductionOrderFormProps) => {
  const [finalProductId, setFinalProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [sheets, setSheets] = useState<TechnicalSheet[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    try {
      const response = await api.get<TechnicalSheet[]>('/technical-sheet');
      setSheets(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar fichas técnicas. Certifique-se de que existem receitas cadastradas.'));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('A quantidade a produzir deve ser um número inteiro maior que zero.');
      setLoading(false);
      return;
    }

    const data = { finalProductId, quantity: parsedQty, notes };

    try {
      await api.post('/production-order', data);
      onSaveSuccess();
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao abrir ordem de produção.'));
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
        <h2 className="text-lg font-semibold text-ink">Abrir Ordem de Produção</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Produto Final (com Ficha Técnica)
            </label>
            <Field
              as="select"
              value={finalProductId}
              onChange={(e) => setFinalProductId(e.target.value)}
              required
            >
              <option value="">Selecione a receita...</option>
              {sheets.map((s) => (
                <option key={s.finalProduct?.id} value={s.finalProduct?.id}>
                  {s.finalProduct?.name} (Receita: {s.name})
                </option>
              ))}
            </Field>
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Quantidade a Produzir
            </label>
            <Field
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              placeholder="Ex: 10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 mb-6">
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
            Observações (Lote, Perdas, Rendimento, etc)
          </label>
          <Field
            as="textarea"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Insira detalhes adicionais sobre o lote de produção..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            <Save size={14} />
            {loading ? 'Salvando...' : 'Abrir Ordem de Produção'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductionOrderForm;
