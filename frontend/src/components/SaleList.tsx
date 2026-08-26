import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { formatBRL } from '../utils/currency';
import { Sale } from '../types';
import Button from './ui/Button';
import Field from './ui/Field';
import { Table, Th } from './ui/Table';

const getPaymentMethodLabel = (method: string): string => {
  switch (method) {
    case 'DINHEIRO':
      return 'Dinheiro';
    case 'CARTAO_DEBITO':
      return 'Cartão Débito';
    case 'CARTAO_CREDITO':
      return 'Cartão Crédito';
    case 'PIX':
      return 'PIX';
    default:
      return method;
  }
};

const SaleList = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await api.get<Sale[]>('/sales');
        setSales(response.data);
      } catch (err) {
        setError(getErrorMessage(err, 'Erro ao carregar vendas.'));
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
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

  const filtered = sales.filter((sale) => {
    const q = search.toLowerCase();
    const dateStr = sale.date ? new Date(sale.date).toLocaleDateString() : '';
    return [sale.personName, getPaymentMethodLabel(sale.paymentMethod), dateStr].some((v) =>
      (v ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h2 className="text-lg font-semibold text-ink">Lista de Vendas</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <Field
              type="text"
              placeholder="Pesquisar cliente, pagamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 py-2 text-sm w-56"
            />
          </div>
          <Button onClick={() => navigate('/sales/new')}>
            <Plus size={14} /> Nova Venda
          </Button>
        </div>
      </div>

      <div className="card p-6">
        {filtered.length === 0 ? (
          <p className="text-center text-ink-muted py-8 text-sm">
            {search ? `Nenhum resultado para "${search}".` : 'Nenhuma venda encontrada.'}
          </p>
        ) : (
          <Table>
              <thead className="bg-surface-2 border-b border-line">
                <tr>
                  <Th>ID</Th>
                  <Th>Data</Th>
                  <Th>Cliente</Th>
                  <Th>Pagamento</Th>
                  <Th className="text-right">Desconto</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((sale) => (
                  <tr key={sale.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 text-sm text-ink">{sale.id}</td>
                    <td className="px-4 py-3 text-sm text-ink">{new Date(sale.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-ink">{sale.personName || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-ink">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-ink-muted">
                        {getPaymentMethodLabel(sale.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink text-right">R$ {formatBRL(sale.discount ?? 0)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-ink text-right">R$ {formatBRL(sale.total ?? 0)}</td>
                    <td className="px-4 py-3">
                      <button
                        className="px-3 py-1.5 text-xs border border-line text-ink font-semibold rounded-lg hover:bg-surface-2 transition-colors"
                        onClick={() => navigate(`/sales/${sale.id}`)}
                      >
                        Ver Detalhes
                      </button>
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

export default SaleList;
