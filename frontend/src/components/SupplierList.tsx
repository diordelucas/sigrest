import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Search } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { Supplier } from '../types';
import Field from './ui/Field';
import Modal from './ui/Modal';
import { Table, Th } from './ui/Table';

interface SupplierListProps {
  refreshTrigger: number | boolean;
  onEditSupplier: (supplier: Supplier) => void;
  isReadOnly: boolean;
}

const SupplierList = ({ refreshTrigger, onEditSupplier, isReadOnly }: SupplierListProps) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await api.get<Supplier[]>('/supplier');
      setSuppliers(response.data);
    } catch (error) {
      setError(getErrorMessage(error, 'Erro ao carregar fornecedores.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/supplier/${id}`);
      setSuppliers(suppliers.filter((s) => s.id !== id));
    } catch (error) {
      setError(getErrorMessage(error, 'Erro ao excluir fornecedor.'));
    } finally {
      setConfirmDelete(null);
    }
  };

  useEffect(() => {
    fetchSuppliers();
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

  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return [s.name, s.cnpj, s.email].some((v) => (v ?? '').toLowerCase().includes(q));
  });

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink">Lista de Fornecedores</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <Field
            type="text"
            placeholder="Pesquisar por nome, CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 py-2 text-sm w-64"
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
          {search ? `Nenhum resultado para "${search}".` : 'Nenhum fornecedor cadastrado.'}
        </p>
      ) : (
        <Table>
            <thead className="bg-surface-2 border-b border-line">
              <tr>
                <Th>ID</Th>
                <Th>Nome</Th>
                <Th>CNPJ</Th>
                <Th>Email</Th>
                {!isReadOnly && <Th>Ações</Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 text-sm text-ink">{s.id}</td>
                  <td className="px-4 py-3 text-sm text-ink">{s.name}</td>
                  <td className="px-4 py-3 text-sm text-ink">{s.cnpj}</td>
                  <td className="px-4 py-3 text-sm text-ink">{s.email}</td>
                  {!isReadOnly && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1.5 text-xs border border-line text-ink font-semibold rounded-lg hover:bg-surface-2 transition-colors flex items-center gap-1"
                          onClick={() => onEditSupplier(s)}
                        >
                          <Pencil size={12} /> Editar
                        </button>
                        <button
                          className="px-3 py-1.5 text-xs bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors flex items-center gap-1"
                          onClick={() => setConfirmDelete(s.id)}
                        >
                          <Trash2 size={12} /> Excluir
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
        </Table>
      )}

      <Modal
        open={confirmDelete !== null}
        variant="danger"
        title="Confirmar exclusão"
        message="Deseja excluir este fornecedor?"
        confirmLabel="Excluir"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete !== null && handleDelete(confirmDelete)}
      />
    </div>
  );
};

export default SupplierList;
