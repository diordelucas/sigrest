import React, { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../services/api';
import { formatBRL } from '../utils/currency';
import { Person, Product } from '../types';
import Button from './ui/Button';
import Field from './ui/Field';

const PAYMENT_METHODS = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
  { value: 'PIX', label: 'PIX' },
];

interface SaleItemForm {
  productId: string;
  quantity: number | string;
  unitPrice: number | string;
}

interface SaleFormState {
  personId: string;
  paymentMethod: string;
  discount: number | string;
  items: SaleItemForm[];
}

const SaleForm = () => {
  const navigate = useNavigate();
  const [sale, setSale] = useState<SaleFormState>({
    personId: '',
    paymentMethod: '',
    discount: 0,
    items: [],
  });
  const [people, setPeople] = useState<Person[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // Identifica este envio de formulário: um retry de rede reenvia a mesma chave, então o
  // backend devolve a venda já criada em vez de duplicá-la (ver PLANO_ACAO_COMPLETO.md, item 8).
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [peopleRes, productsRes] = await Promise.all([
          api.get<Person[]>('/person'),
          api.get<Product[]>('/product'),
        ]);
        setPeople(peopleRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Erro ao carregar dados.'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSale({ ...sale, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index: number, e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newItems = [...sale.items];
    newItems[index] = { ...newItems[index], [e.target.name]: e.target.value };
    if (e.target.name === 'productId') {
      const product = products.find((p) => String(p.id) === e.target.value);
      if (product) newItems[index].unitPrice = product.sellPrice ?? 0;
    }
    setSale({ ...sale, items: newItems });
  };

  const handleAddItem = () => {
    setSale({
      ...sale,
      items: [...sale.items, { productId: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...sale.items];
    newItems.splice(index, 1);
    setSale({ ...sale, items: newItems });
  };

  const calculateSubtotal = () =>
    sale.items.reduce((sum, item) => sum + (parseFloat(String(item.quantity)) || 0) * (parseFloat(String(item.unitPrice)) || 0), 0);

  const calculateTotal = () => {
    const total = calculateSubtotal() - (parseFloat(String(sale.discount)) || 0);
    return Math.max(0, total).toFixed(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sale.items.length === 0) {
      toast.error('Adicione pelo menos um item à venda.');
      return;
    }
    setSubmitting(true);
    try {
      const saleToSubmit = {
        ...sale,
        personId: sale.personId !== '' ? Number(sale.personId) : null,
        total: parseFloat(calculateTotal()),
        discount: parseFloat(String(sale.discount)) || 0,
        items: sale.items.map((item) => ({
          ...item,
          quantity: parseInt(String(item.quantity), 10),
          unitPrice: parseFloat(String(item.unitPrice)),
        })),
        idempotencyKey: idempotencyKeyRef.current,
      };
      await api.post('/sales', saleToSubmit);
      idempotencyKeyRef.current = crypto.randomUUID();
      toast.success('Venda registrada com sucesso!');
      navigate('/sales');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao registrar venda.'));
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
        <h2 className="text-lg font-semibold text-ink mb-6">Registrar Nova Venda</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
                Cliente <span className="normal-case font-normal text-ink-muted">(opcional)</span>
              </label>
              <Field
                as="select"
                name="personId"
                data-testid="sale-person"
                value={sale.personId}
                onChange={handleSaleChange}
              >
                <option value="">Selecione...</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </Field>
            </div>
            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
                Forma de Pagamento
              </label>
              <Field
                as="select"
                name="paymentMethod"
                data-testid="sale-payment"
                value={sale.paymentMethod}
                onChange={handleSaleChange}
                required
              >
                <option value="">Selecione...</option>
                {PAYMENT_METHODS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Field>
            </div>
            <div className="flex flex-col gap-1">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
                Desconto
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium">R$</span>
                <Field
                  type="number"
                  name="discount"
                  data-testid="sale-discount"
                  step="0.01"
                  min="0"
                  className="pl-8"
                  value={sale.discount}
                  onChange={handleSaleChange}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-line my-4 flex items-center gap-3">
            <span className="text-xs text-ink-muted font-medium">ITENS DA VENDA</span>
          </div>

          {sale.items.map((item, index) => (
            <div key={index} className="bg-surface-2 border border-line rounded-xl p-4 mb-3">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
                    Produto
                  </label>
                  <Field
                    as="select"
                    name="productId"
                    data-testid="sale-item-product"
                    className="bg-surface"
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, e)}
                    required
                  >
                    <option value="">Selecione...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                        {product.categoryName ? ` · ${product.categoryName}` : ''} ({product.storage} un.)
                        {product.storage <= product.minStorage ? ' ⚠' : ''}
                      </option>
                    ))}
                  </Field>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Qtd</label>
                  <Field
                    type="number"
                    name="quantity"
                    data-testid="sale-item-qty"
                    min="1"
                    className="bg-surface"
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
                    <Field
                      type="number"
                      name="unitPrice"
                      step="0.01"
                      min="0"
                      className="pl-8 bg-surface"
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

          <Button
            type="button"
            variant="secondary"
            data-testid="sale-add-item"
            className="mt-1"
            onClick={handleAddItem}
          >
            <Plus size={14} /> Adicionar Item
          </Button>

          <div className="mt-4 bg-surface-2 border border-line rounded-xl p-4">
            <div className="flex flex-col items-end gap-1">
              <p className="text-sm text-ink-muted">
                Subtotal: <strong className="text-ink">R$ {formatBRL(calculateSubtotal())}</strong>
              </p>
              <p className="text-sm text-ink-muted">
                Desconto: <strong className="text-ink">R$ {formatBRL(parseFloat(String(sale.discount || 0)))}</strong>
              </p>
              <div className="w-48 border-t border-line my-1" />
              <p className="text-base font-bold text-primary-600 dark:text-primary-400">
                Total: R$ {formatBRL(Number(calculateTotal()))}
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="submit"
              data-testid="sale-submit"
              disabled={submitting}
              loading={submitting}
              loadingText="Registrando..."
            >
              Registrar Venda
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/sales')}
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

export default SaleForm;
