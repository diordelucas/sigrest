import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { formatBRL } from '../utils/currency';
import { CashRegister } from '../types';
import Field from './ui/Field';
import { Table, Th } from './ui/Table';

const CashRegisterList = () => {
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCashRegisters = async () => {
      try {
        const response = await api.get<CashRegister[]>('/cash-registers');
        setCashRegisters(response.data);
      } catch (err) {
        setError(getErrorMessage(err, 'Erro ao carregar caixas.'));
      } finally {
        setLoading(false);
      }
    };
    fetchCashRegisters();
  }, []);

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

  const filtered = cashRegisters.filter((cr) => {
    const q = search.toLowerCase();
    const statusLabel = cr.open ? 'aberto' : 'fechado';
    return [cr.openedBy?.name, cr.closedBy?.name, statusLabel].some((v) => (v ?? '').toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-ink">Histórico de Caixas</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <Field
            type="text"
            placeholder="Pesquisar usuário, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 py-2 text-sm w-64"
          />
        </div>
      </div>

      <div className="card p-6">
        {filtered.length === 0 ? (
          <p className="text-center text-ink-muted py-8 text-sm">
            {search ? `Nenhum resultado para "${search}".` : 'Nenhum caixa encontrado.'}
          </p>
        ) : (
          <Table>
              <thead className="bg-surface-2 border-b border-line">
                <tr>
                  <Th>ID</Th>
                  <Th>Abertura</Th>
                  <Th>Fechamento</Th>
                  <Th className="text-right">Saldo Inicial</Th>
                  <Th className="text-right">Saldo Final</Th>
                  <Th>Status</Th>
                  <Th>Aberto por</Th>
                  <Th>Fechado por</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((cr) => (
                  <tr key={cr.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 text-sm text-ink">{cr.id}</td>
                    <td className="px-4 py-3 text-sm text-ink">{new Date(cr.openingTime).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-ink">
                      {cr.closingTime ? new Date(cr.closingTime).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink text-right">R$ {formatBRL(cr.openingBalance ?? 0)}</td>
                    <td className="px-4 py-3 text-sm text-ink text-right">
                      {cr.closingBalance != null ? `R$ ${formatBRL(cr.closingBalance)}` : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cr.open ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-2 text-ink-muted'
                        }`}
                      >
                        {cr.open ? 'ABERTO' : 'FECHADO'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink">{cr.openedBy?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-ink">{cr.closedBy?.name || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default CashRegisterList;
