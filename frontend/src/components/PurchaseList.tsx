import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { formatBRL } from '../utils/currency';
import { Purchase } from '../types';

const PurchaseList = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await api.get<Purchase[]>('/purchases');
        setPurchases(response.data);
      } catch (err) {
        setError(getErrorMessage(err, 'Erro ao carregar compras.'));
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
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

  const filtered = purchases.filter((purchase) => {
    const q = search.toLowerCase();
    const dateStr = purchase.date ? new Date(purchase.date).toLocaleDateString() : '';
    return [purchase.supplier?.name, dateStr].some((v) => (v ?? '').toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h2 className="text-lg font-semibold text-ink">Lista de Compras</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar fornecedor, data..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-8 py-2 text-sm w-56"
            />
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/purchases/new')}>
            <Plus size={14} /> Nova Compra
          </button>
        </div>
      </div>

      <div className="card p-6">
        {filtered.length === 0 ? (
          <p className="text-center text-ink-muted py-8 text-sm">
            {search ? `Nenhum resultado para "${search}".` : 'Nenhuma compra encontrada.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2 border-b border-line">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Fornecedor
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink-muted uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 text-sm text-ink">{purchase.id}</td>
                    <td className="px-4 py-3 text-sm text-ink">{new Date(purchase.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-ink">{purchase.supplier ? purchase.supplier.name : 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-ink text-right">R$ {formatBRL(purchase.total ?? 0)}</td>
                    <td className="px-4 py-3">
                      <button
                        className="px-3 py-1.5 text-xs border border-line text-ink font-semibold rounded-lg hover:bg-surface-2 transition-colors"
                        onClick={() => navigate(`/purchases/${purchase.id}`)}
                      >
                        Ver Detalhes
                      </button>
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

export default PurchaseList;
