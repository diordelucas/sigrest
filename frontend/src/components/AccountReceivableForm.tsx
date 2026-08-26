import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../services/api';
import { Person } from '../types';
import Button from './ui/Button';
import Field from './ui/Field';

interface AccountReceivableFormState {
  description: string;
  amount: string;
  dueDate: string;
  personId: string;
}

const AccountReceivableForm = () => {
  const navigate = useNavigate();
  const [accountReceivable, setAccountReceivable] = useState<AccountReceivableFormState>({
    description: '',
    amount: '',
    dueDate: '',
    personId: '',
  });
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<Person[]>('/person')
      .then((r) => setPeople(r.data))
      .catch((err) => toast.error(getErrorMessage(err, 'Erro ao carregar clientes.')))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAccountReceivable({ ...accountReceivable, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/accounts-receivable', {
        ...accountReceivable,
        amount: parseFloat(accountReceivable.amount),
      });
      toast.success('Conta a receber registrada com sucesso!');
      setAccountReceivable({ description: '', amount: '', dueDate: '', personId: '' });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao registrar conta a receber.'));
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
    <div>
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-ink mb-6">Registrar Conta a Receber</h2>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1 mb-4">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Descrição
            </label>
            <Field
              name="description"
              value={accountReceivable.description}
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
                <Field
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0"
                  className="pl-8"
                  value={accountReceivable.amount}
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
              <Field
                type="date"
                name="dueDate"
                value={accountReceivable.dueDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 mb-6">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Cliente</label>
            <Field
              as="select"
              name="personId"
              value={accountReceivable.personId}
              onChange={handleChange}
              required
            >
              <option value="">Selecione o cliente...</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Field>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={submitting} loading={submitting} loadingText="Registrando...">
              Registrar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/accounts-receivable')}
              disabled={submitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountReceivableForm;
