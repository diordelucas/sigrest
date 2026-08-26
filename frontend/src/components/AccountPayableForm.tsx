import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../services/api';
import { Supplier } from '../types';

interface AccountPayableFormState {
  description: string;
  amount: string;
  dueDate: string;
  supplierId: string;
}

const AccountPayableForm = () => {
  const navigate = useNavigate();
  const [accountPayable, setAccountPayable] = useState<AccountPayableFormState>({
    description: '',
    amount: '',
    dueDate: '',
    supplierId: '',
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<Supplier[]>('/supplier')
      .then((r) => setSuppliers(r.data))
      .catch((err) => toast.error(getErrorMessage(err, 'Erro ao carregar fornecedores.')))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAccountPayable({ ...accountPayable, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/accounts-payable', {
        ...accountPayable,
        amount: parseFloat(accountPayable.amount),
      });
      toast.success('Conta a pagar registrada com sucesso!');
      setAccountPayable({ description: '', amount: '', dueDate: '', supplierId: '' });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao registrar conta a pagar.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-line border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-ink mb-6">Registrar Conta a Pagar</h2>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1 mb-4">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Descrição
            </label>
            <input
              className="input-field"
              name="description"
              value={accountPayable.description}
              onChange={handleChange}
              required
              placeholder="Descrição da conta"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Valor</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium">R$</span>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0"
                  className="input-field pl-8"
                  value={accountPayable.amount}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
                Data de Vencimento
              </label>
              <input
                type="date"
                name="dueDate"
                className="input-field"
                value={accountPayable.dueDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 mb-6">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Fornecedor
            </label>
            <select
              name="supplierId"
              className="input-field appearance-none"
              value={accountPayable.supplierId}
              onChange={handleChange}
              required
            >
              <option value="">Selecione o fornecedor...</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar'
              )}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/accounts-payable')}
              disabled={submitting}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountPayableForm;
