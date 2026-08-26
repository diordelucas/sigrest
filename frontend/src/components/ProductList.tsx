import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, RefreshCw, Search } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import CategoryTag from './CategoryTag';
import { formatBRL } from '../utils/currency';
import { Product } from '../types';

const baseUnitOf = (purchaseUnit: string | null): string => {
  if (!purchaseUnit) return 'un.';
  if (['G', 'KG'].includes(purchaseUnit)) return 'g';
  if (['ML', 'L'].includes(purchaseUnit)) return 'ml';
  return 'un';
};

interface ProductListProps {
  refreshTrigger: number;
  onEditPerson: (product: Product) => void;
  isReadOnly: boolean;
}

const ProductList = ({ refreshTrigger, onEditPerson, isReadOnly }: ProductListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get<Product[]>('/product');
      setProducts(response.data);
    } catch (error) {
      setError(getErrorMessage(error, 'Erro ao carregar a lista de produtos.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await api.delete(`/product/${id}`);
        setProducts(products.filter((product) => product.id !== id));
      } catch (error) {
        setError(getErrorMessage(error, 'Erro ao excluir produto.'));
      }
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-line border-t-primary-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const filtered = products.filter((product) => {
    const q = search.toLowerCase();
    return [product.name, product.code, product.categoryName].some((v) => (v ?? '').toLowerCase().includes(q));
  });

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink">Lista de Produtos</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar por nome, código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-8 py-2 text-sm w-64"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-ink-muted py-8 text-sm">
          {search ? `Nenhum resultado para "${search}".` : 'Nenhum produto cadastrado.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2 border-b border-line">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">Preço Compra</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">Preço Venda</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">Estoque</th>
                {!isReadOnly && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 text-sm text-ink">{product.id}</td>
                  <td className="px-4 py-3 text-sm text-ink">{product.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <CategoryTag name={product.categoryName} />
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">{product.code}</td>
                  <td className="px-4 py-3 text-sm text-ink">R$ {formatBRL(product.price ?? 0)}</td>
                  <td className="px-4 py-3 text-sm text-ink">R$ {formatBRL(product.sellPrice ?? 0)}</td>
                  <td className="px-4 py-3 text-sm text-ink">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (product.storage ?? 0) <= (product.minStorage ?? 0)
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {product.storage ?? 0} {baseUnitOf(product.purchaseUnit)}
                    </span>
                  </td>
                  {!isReadOnly && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          className="px-3 py-1.5 text-xs border border-line text-ink font-semibold rounded-lg hover:bg-surface-2 transition-colors flex items-center gap-1"
                          onClick={() => onEditPerson(product)}
                        >
                          <Pencil size={12} /> Editar
                        </button>
                        <button
                          className="px-3 py-1.5 text-xs bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors flex items-center gap-1"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 size={12} /> Excluir
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        <button
          className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={fetchProducts}
          disabled={loading}
        >
          <RefreshCw size={14} /> Atualizar Lista
        </button>
      </div>
    </div>
  );
};

export default ProductList;
