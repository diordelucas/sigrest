import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { formatBRL } from '../utils/currency';
import { AccountPayable, AccountPayableStatus } from '../types';
import Button from './ui/Button';
import Field from './ui/Field';
import { Table, Th } from './ui/Table';

const getStatusBadge = (status: AccountPayableStatus | string) => {
  switch (status) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          PENDENTE
        </span>
      );
    case 'PAID':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          PAGO
        </span>
      );
    case 'OVERDUE':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
          ATRASADO
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-ink-muted">
          {status}
        </span>
      );
  }
};

const AccountPayableList = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get<AccountPayable[]>('/accounts-payable');
        setAccounts(response.data);
      } catch (err) {
        setError(getErrorMessage(err, 'Erro ao carregar contas a pagar.'));
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [refreshTrigger]);

  const handlePayAccount = async (id: number) => {
    try {
      await api.put(`/accounts-payable/pay/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao pagar conta.'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-line border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">{error}</div>;
  }

  const filtered = accounts.filter((account) => {
    const q = search.toLowerCase();
    const statusLabel = account.status === 'PENDING' ? 'pendente' : account.status === 'PAID' ? 'pago' : 'atrasado';
    return [account.description, account.supplier?.name, statusLabel].some((v) => (v ?? '').toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h2 className="text-lg font-semibold text-ink">Contas a Pagar</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <Field
              type="text"
              placeholder="Pesquisar descrição, fornecedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 py-2 text-sm w-64"
            />
          </div>
          <Button onClick={() => navigate('/accounts-payable/new')}>
            <Plus size={14} /> Nova Conta a Pagar
          </Button>
        </div>
      </div>

      <div className="card p-6">
        {filtered.length === 0 ? (
          <p className="text-center text-ink-muted py-8 text-sm">
            {search ? `Nenhum resultado para "${search}".` : 'Nenhuma conta a pagar encontrada.'}
          </p>
        ) : (
          <Table>
              <thead className="bg-surface-2 border-b border-line">
                <tr>
                  <Th>ID</Th>
                  <Th>Descrição</Th>
                  <Th className="text-right">Valor</Th>
                  <Th>Vencimento</Th>
                  <Th>Fornecedor</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((account) => (
                  <tr key={account.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 text-sm text-ink">{account.id}</td>
                    <td className="px-4 py-3 text-sm text-ink">{account.description}</td>
                    <td className="px-4 py-3 text-sm text-ink text-right">R$ {formatBRL(account.amount ?? 0)}</td>
                    <td className="px-4 py-3 text-sm text-ink">{new Date(account.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-ink">{account.supplier?.name || 'N/A'}</td>
                    <td className="px-4 py-3">{getStatusBadge(account.status)}</td>
                    <td className="px-4 py-3">
                      {account.status === 'PENDING' && (
                        <button
                          className="px-3 py-1.5 text-xs bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1"
                          onClick={() => handlePayAccount(account.id)}
                        >
                          <CheckCircle2 size={12} /> Pagar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AccountPayableList;
