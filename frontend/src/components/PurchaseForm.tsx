import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { Supplier, Product } from '../types';

interface PurchaseItemForm {
  productId: string;
  quantity: number | string;
  unitPrice: number | string;
}

interface PurchaseFormState {
  date: string;
  supplierId: string;
  items: PurchaseItemForm[];
}

const PurchaseForm = () => {
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<PurchaseFormState>({
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    items: [],
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, productsRes] = await Promise.all([
          api.get<Supplier[]>('/supplier'),
          api.get<Product[]>('/product'),
        ]);
        setSuppliers(suppliersRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        setError(getErrorMessage(err, 'Erro ao carregar dados.'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePurchaseChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPurchase({ ...purchase, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index: number, e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newItems = [...purchase.items];
    newItems[index] = { ...newItems[index], [e.target.name]: e.target.value };
    setPurchase({ ...purchase, items: newItems });
  };

  const handleAddItem = () => {
    setPurchase({
      ...purchase,
      items: [...purchase.items, { productId: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...purchase.items];
    newItems.splice(index, 1);
    setPurchase({ ...purchase, items: newItems });
  };

  const calculateTotal = () => {
    return purchase.items
      .reduce((sum, item) => {
        const quantity = parseFloat(String(item.quantity)) || 0;
        const unitPrice = parseFloat(String(item.unitPrice)) || 0;
        return sum + quantity * unitPrice;
      }, 0)
      .toFixed(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const purchaseToSubmit = {
        ...purchase,
        total: parseFloat(calculateTotal()),
        items: purchase.items.map((item) => ({
          ...item,
          quantity: parseInt(String(item.quantity), 10),
          unitPrice: parseFloat(String(item.unitPrice)),
        })),
      };
      await api.post('/purchases', purchaseToSubmit);
      navigate('/purchases');
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao registrar compra.'));
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            className="p-2 border border-line text-ink-muted rounded-lg hover:bg-surface-2 transition-colors"
            onClick={() => navigate('/purchases')}
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-lg font-semibold text-ink">Registrar Nova Compra</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
                Data da Compra
              </label>
              <input
                type="date"
                name="date"
                className="input-field"
                value={purchase.date}
                onChange={handlePurchaseChange}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
                Fornecedor
              </label>
              <select
                name="supplierId"
                className="input-field appearance-none"
                value={purchase.supplierId}
                onChange={handlePurchaseChange}
                required
              >
                <option value="">Selecione...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-line my-4 flex items-center gap-3">
            <span className="text-xs text-ink-muted font-medium">ITENS DA COMPRA</span>
          </div>

          {purchase.items.map((item, index) => (
            <div key={index} className="bg-surface-2 border border-line rounded-xl p-4 mb-3">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
                    Produto
                  </label>
                  <select
                    name="productId"
                    className="input-field appearance-none bg-surface"
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, e)}
                    required
                  >
                    <option value="">Selecione...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                        {product.categoryName ? ` · ${product.categoryName}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    className="input-field bg-surface"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, e)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
                    Preço Unit.
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium">R$</span>
                    <input
                      type="number"
                      name="unitPrice"
                      step="0.01"
                      min="0"
                      className="input-field pl-8 bg-surface"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, e)}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-end pb-0.5">
                  <button
                    type="button"
                    className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn-secondary flex items-center gap-2 mt-2"
            onClick={handleAddItem}
          >
            <Plus size={14} /> Adicionar Item
          </button>

          <div className="mt-6 text-right">
            <p className="text-base font-semibold text-ink">
              Total da Compra:{' '}
              <span className="text-primary-600 dark:text-primary-400">R$ {calculateTotal()}</span>
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button type="submit" className="btn-primary">
              Registrar Compra
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/purchases')}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseForm;
