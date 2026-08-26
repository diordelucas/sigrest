import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { formatBRL } from '../utils/currency';
import { AccountReceivable, AccountReceivableStatus } from '../types';

const getStatusBadge = (status: AccountReceivableStatus | string) => {
  switch (status) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          PENDENTE
        </span>
      );
    case 'RECEIVED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          RECEBIDO
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

const AccountReceivableList = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AccountReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get<AccountReceivable[]>('/accounts-receivable');
        setAccounts(response.data);
      } catch (err) {
        setError(getErrorMessage(err, 'Erro ao carregar contas a receber.'));
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [refreshTrigger]);

  const handleReceiveAccount = async (id: number) => {
    try {
      await api.put(`/accounts-receivable/receive/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao receber conta.'));
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
    const statusLabel =
      account.status === 'PENDING' ? 'pendente' : account.status === 'RECEIVED' ? 'recebido' : 'atrasado';
    return [account.description, account.person?.name, statusLabel].some((v) => (v ?? '').toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h2 className="text-lg font-semibold text-ink">Contas a Receber</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar descrição, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-8 py-2 text-sm w-64"
            />
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/accounts-receivable/new')}>
            <Plus size={14} /> Nova Conta a Receber
          </button>
        </div>
      </div>

      <div className="card p-6">
        {filtered.length === 0 ? (
          <p className="text-center text-ink-muted py-8 text-sm">
            {search ? `Nenhum resultado para "${search}".` : 'Nenhuma conta a receber encontrada.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2 border-b border-line">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink-muted uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((account) => (
                  <tr key={account.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 text-sm text-ink">{account.id}</td>
                    <td className="px-4 py-3 text-sm text-ink">{account.description}</td>
                    <td className="px-4 py-3 text-sm text-ink text-right">R$ {formatBRL(account.amount ?? 0)}</td>
                    <td className="px-4 py-3 text-sm text-ink">{new Date(account.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-ink">{account.person?.name || 'N/A'}</td>
                    <td className="px-4 py-3">{getStatusBadge(account.status)}</td>
                    <td className="px-4 py-3">
                      {account.status === 'PENDING' && (
                        <button
                          className="px-3 py-1.5 text-xs bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1"
                          onClick={() => handleReceiveAccount(account.id)}
                        >
                          <CheckCircle2 size={12} /> Receber
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountReceivableList;
