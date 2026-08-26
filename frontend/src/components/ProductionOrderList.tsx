import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle2, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../services/api';
import moment from 'moment';
import { ProductionOrder, ProductionOrderStatus } from '../types';
import Button from './ui/Button';
import Field from './ui/Field';
import Modal from './ui/Modal';
import { Table, Th } from './ui/Table';

const getStatusBadge = (status: ProductionOrderStatus | string) => {
  switch (status) {
    case 'OPEN':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800">
          ABERTA
        </span>
      );
    case 'FINISHED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          FINALIZADA
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
          CANCELADA
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

interface ProductionOrderListProps {
  refreshTrigger: number | boolean;
  onNewOrder: () => void;
}

const ProductionOrderList = ({ refreshTrigger, onNewOrder }: ProductionOrderListProps) => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [search, setSearch] = useState('');
  const [confirmFinish, setConfirmFinish] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get<ProductionOrder[]>('/production-order');
      setOrders(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar ordens de produção.'));
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (id: number) => {
    try {
      await api.post(`/production-order/${id}/finish`);
      setSuccessMessage('Ordem de Produção finalizada com sucesso!');
      setTimeout(() => setSuccessMessage(''), 4000);
      fetchOrders();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao finalizar ordem de produção.'));
    } finally {
      setConfirmFinish(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/production-order/${id}`);
      setOrders(orders.filter((o) => o.id !== id));
      setSuccessMessage('Ordem de Produção excluída com sucesso!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao excluir ordem de produção.'));
    } finally {
      setConfirmDelete(null);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-line border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = orders.filter((order) => {
    const q = search.toLowerCase();
    const statusLabel = order.status === 'OPEN' ? 'aberta' : order.status === 'FINISHED' ? 'finalizada' : 'cancelada';
    return [order.finalProduct?.name, statusLabel, order.notes].some((v) => (v ?? '').toLowerCase().includes(q));
  });

  return (
    <div className="card p-6 mb-6">
      <div className="flex justify-between items-center mb-4 gap-4">
        <h2 className="text-lg font-semibold text-ink">Ordens de Produção</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <Field
              type="text"
              placeholder="Pesquisar produto, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 py-2 text-sm w-56"
            />
          </div>
          <Button onClick={onNewOrder}>
            <Plus size={14} /> Nova Ordem
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">{error}</div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 text-sm">
          {successMessage}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-ink-muted py-8 text-sm">
          {search ? `Nenhum resultado para "${search}".` : 'Nenhuma ordem de produção cadastrada.'}
        </p>
      ) : (
        <Table>
            <thead className="bg-surface-2 border-b border-line">
              <tr>
                <Th>ID</Th>
                <Th>Produto Final</Th>
                <Th className="text-center">Qtd</Th>
                <Th>Data de Abertura</Th>
                <Th>Status</Th>
                <Th>Observações</Th>
                <Th className="text-center">Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 text-sm text-ink">{order.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-ink">
                    {order.finalProduct?.name || 'Produto não identificado'}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-ink text-center">{order.quantity}</td>
                  <td className="px-4 py-3 text-sm text-ink">
                    {order.date ? moment(order.date).format('DD/MM/YYYY HH:mm') : '-'}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                  <td className="px-4 py-3 text-sm text-ink max-w-xs truncate" title={order.notes || ''}>
                    {order.notes || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                      {order.status === 'OPEN' && (
                        <button
                          className="px-3 py-1.5 text-xs bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1"
                          onClick={() => setConfirmFinish(order.id)}
                        >
                          <CheckCircle2 size={12} /> Finalizar
                        </button>
                      )}
                      <button
                        className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                        onClick={() => setConfirmDelete(order.id)}
                        title="Excluir Ordem"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
        </Table>
      )}

      <Modal
        open={confirmFinish !== null}
        title="Finalizar ordem de produção"
        message="Deseja realmente finalizar esta Ordem de Produção? Os estoques de insumos serão debitados e o produto acabado será creditado."
        confirmLabel="Finalizar"
        onCancel={() => setConfirmFinish(null)}
        onConfirm={() => confirmFinish !== null && handleFinish(confirmFinish)}
      />

      <Modal
        open={confirmDelete !== null}
        variant="danger"
        title="Confirmar exclusão"
        message="Tem certeza que deseja excluir esta ordem de produção?"
        confirmLabel="Excluir"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete !== null && handleDelete(confirmDelete)}
      />
    </div>
  );
};

export default ProductionOrderList;
