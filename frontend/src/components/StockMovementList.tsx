import React, { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../services/api';
import CategoryTag from './CategoryTag';
import { Search } from 'lucide-react';
import { StockMovement } from '../types';
import Field from './ui/Field';
import { Table, Th } from './ui/Table';

const StockMovementList = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStockMovements = async () => {
      try {
        const response = await api.get<StockMovement[]>('/stock-movements');
        setMovements(response.data);
      } catch (err) {
        setError(getErrorMessage(err, 'Erro ao carregar movimentações de estoque.'));
      } finally {
        setLoading(false);
      }
    };
    fetchStockMovements();
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

  const filtered = movements.filter((m) => {
    const q = search.toLowerCase();
    const typeLabel = m.type === 'ENTRY' ? 'entrada' : 'saída';
    return [m.product?.name, m.description, typeLabel].some((v) => (v ?? '').toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-ink">Histórico de Movimentações de Estoque</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <Field
            type="text"
            placeholder="Pesquisar produto, descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 py-2 text-sm w-64"
          />
        </div>
      </div>

      <div className="card p-6">
        {filtered.length === 0 ? (
          <p className="text-center text-ink-muted py-8 text-sm">
            {search ? `Nenhum resultado para "${search}".` : 'Nenhuma movimentação de estoque encontrada.'}
          </p>
        ) : (
          <Table>
              <thead className="bg-surface-2 border-b border-line">
                <tr>
                  <Th>ID</Th>
                  <Th>Data/Hora</Th>
                  <Th>Produto</Th>
                  <Th>Tipo</Th>
                  <Th className="text-right">Quantidade</Th>
                  <Th>Descrição</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((movement) => (
                  <tr key={movement.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 text-sm text-ink">{movement.id}</td>
                    <td className="px-4 py-3 text-sm text-ink">{new Date(movement.date).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-ink">
                      <div className="flex items-center gap-2">
                        <span>{movement.product ? movement.product.name : 'N/A'}</span>
                        {movement.product?.categoryName && <CategoryTag name={movement.product.categoryName} />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          movement.type === 'ENTRY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {movement.type === 'ENTRY' ? 'ENTRADA' : 'SAÍDA'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink text-right">{movement.quantity}</td>
                    <td className="px-4 py-3 text-sm text-ink">{movement.description}</td>
                  </tr>
                ))}
              </tbody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default StockMovementList;
