import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { TechnicalSheet } from '../types';
import Button from './ui/Button';
import Field from './ui/Field';
import Modal from './ui/Modal';
import { Table, Th } from './ui/Table';

interface TechnicalSheetListProps {
  refreshTrigger: number | boolean;
  onEditSheet: (sheet: TechnicalSheet) => void;
  onNewSheet: () => void;
  isReadOnly: boolean;
}

const TechnicalSheetList = ({ refreshTrigger, onEditSheet, onNewSheet, isReadOnly }: TechnicalSheetListProps) => {
  const [sheets, setSheets] = useState<TechnicalSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchSheets = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get<TechnicalSheet[]>('/technical-sheet');
      setSheets(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao carregar fichas técnicas.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/technical-sheet/${id}`);
      setSheets(sheets.filter((s) => s.id !== id));
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao excluir ficha técnica.'));
    } finally {
      setConfirmDelete(null);
    }
  };

  useEffect(() => {
    fetchSheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-4 border-line border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = sheets.filter((sheet) => {
    const q = search.toLowerCase();
    return [sheet.name, sheet.finalProduct?.name].some((v) => (v ?? '').toLowerCase().includes(q));
  });

  return (
    <div className="card p-6 mb-6">
      <div className="flex justify-between items-center mb-4 gap-4">
        <h2 className="text-lg font-semibold text-ink">Fichas Técnicas (Receitas)</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <Field
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 py-2 text-sm w-56"
            />
          </div>
          {!isReadOnly && (
            <Button onClick={onNewSheet}>
              <Plus size={14} /> Nova Ficha Técnica
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">{error}</div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-ink-muted py-8 text-sm">
          {search ? `Nenhum resultado para "${search}".` : 'Nenhuma ficha técnica cadastrada.'}
        </p>
      ) : (
        <Table>
            <thead className="bg-surface-2 border-b border-line">
              <tr>
                <Th>ID</Th>
                <Th>Nome da Receita</Th>
                <Th>Produto Final</Th>
                <Th className="text-center">Qtd. de Insumos</Th>
                {!isReadOnly && <Th className="text-center">Ações</Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((sheet) => (
                <tr key={sheet.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 text-sm text-ink">{sheet.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-ink">{sheet.name}</td>
                  <td className="px-4 py-3 text-sm text-ink">
                    {sheet.finalProduct?.name || 'Produto não identificado'}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-ink-muted">
                      {sheet.items ? sheet.items.length : 0}
                    </span>
                  </td>
                  {!isReadOnly && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button
                          className="p-1.5 border border-line text-ink rounded-lg hover:bg-surface-2 transition-colors"
                          onClick={() => onEditSheet(sheet)}
                          title="Editar Ficha"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                          onClick={() => setConfirmDelete(sheet.id)}
                          title="Excluir Ficha"
                        >
                          <Trash2 size={14} />
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
        message="Tem certeza que deseja excluir esta ficha técnica?"
        confirmLabel="Excluir"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete !== null && handleDelete(confirmDelete)}
      />
    </div>
  );
};

export default TechnicalSheetList;
