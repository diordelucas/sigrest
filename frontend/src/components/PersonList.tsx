import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, RefreshCw, Search } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { Person } from '../types';
import Button from './ui/Button';
import Field from './ui/Field';
import Modal from './ui/Modal';
import { Table, Th } from './ui/Table';

interface PersonListProps {
  refreshTrigger: number | boolean;
  onEditPerson: (person: Person) => void;
  isReadOnly: boolean;
}

const PersonList = ({ refreshTrigger, onEditPerson, isReadOnly }: PersonListProps) => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const fetchPersons = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get<Person[]>('/person');
      setPersons(response.data);
    } catch (error) {
      setError(getErrorMessage(error, 'Erro ao carregar a lista de pessoas.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/person/${id}`);
      setPersons(persons.filter((person) => person.id !== id));
    } catch (error) {
      setError(getErrorMessage(error, 'Erro ao excluir pessoa.'));
    } finally {
      setConfirmDelete(null);
    }
  };

  useEffect(() => {
    fetchPersons();
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

  const filtered = persons.filter((person) => {
    const q = search.toLowerCase();
    return [person.name, person.cpf, person.phone, person.email, person.city, person.uf].some((v) =>
      (v ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink">Lista de Pessoas</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <Field
            type="text"
            placeholder="Pesquisar por nome, CPF, cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 py-2 text-sm w-72"
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
          {search ? `Nenhum resultado para "${search}".` : 'Nenhuma pessoa cadastrada.'}
        </p>
      ) : (
        <Table>
            <thead className="bg-surface-2 border-b border-line">
              <tr>
                <Th>ID</Th>
                <Th>Nome</Th>
                <Th>CPF</Th>
                <Th>Telefone</Th>
                <Th>Email</Th>
                <Th>Endereço</Th>
                <Th>Cidade</Th>
                <Th>UF</Th>
                {!isReadOnly && <Th>Ações</Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((person) => (
                <tr key={person.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 text-sm text-ink">{person.id}</td>
                  <td className="px-4 py-3 text-sm text-ink">{person.name}</td>
                  <td className="px-4 py-3 text-sm text-ink">{person.cpf}</td>
                  <td className="px-4 py-3 text-sm text-ink">{person.phone}</td>
                  <td className="px-4 py-3 text-sm text-ink">{person.email}</td>
                  <td className="px-4 py-3 text-sm text-ink">
                    {person.street && person.number && person.nbhd
                      ? `${person.street}, ${person.number} - ${person.nbhd}`
                      : 'Não informado'}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink">{person.city || 'Não informado'}</td>
                  <td className="px-4 py-3 text-sm text-ink">{person.uf || 'Não informado'}</td>
                  {!isReadOnly && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          className="px-3 py-1.5 text-xs border border-line text-ink font-semibold rounded-lg hover:bg-surface-2 transition-colors flex items-center gap-1"
                          onClick={() => onEditPerson(person)}
                        >
                          <Pencil size={12} /> Editar
                        </button>
                        <button
                          className="px-3 py-1.5 text-xs bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors flex items-center gap-1"
                          onClick={() => setConfirmDelete(person.id)}
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

      <div className="mt-4">
        <Button
          variant="secondary"
          className="disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={fetchPersons}
          disabled={loading}
        >
          <RefreshCw size={14} /> Atualizar Lista
        </Button>
      </div>

      <Modal
        open={confirmDelete !== null}
        variant="danger"
        title="Confirmar exclusão"
        message="Tem certeza que deseja excluir esta pessoa?"
        confirmLabel="Excluir"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete !== null && handleDelete(confirmDelete)}
      />
    </div>
  );
};

export default PersonList;
