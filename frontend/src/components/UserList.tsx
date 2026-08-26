import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, RefreshCw, Search } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { User } from '../types';

interface UserListProps {
  refreshTrigger: number | boolean;
  onEditUser: (user: User) => void;
}

const UserList = ({ refreshTrigger, onEditUser }: UserListProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get<User[]>('/user');
      setUsers(response.data);
    } catch (error) {
      setError(getErrorMessage(error, 'Erro ao carregar a lista de usuários.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await api.delete(`/user/${id}`);
        await fetchUsers();
      } catch (error) {
        setError(getErrorMessage(error, 'Erro ao excluir usuário.'));
      }
    }
  };

  useEffect(() => {
    fetchUsers();
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

  const filtered = users.filter((user) => {
    const q = search.toLowerCase();
    return [user.name, user.email, user.role].some((v) => (v ?? '').toLowerCase().includes(q));
  });

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink">Lista de Usuários</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar..."
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
          {search ? `Nenhum resultado para "${search}".` : 'Nenhum usuário cadastrado.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2 border-b border-line">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Nível de Acesso
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 text-sm text-ink">{user.id}</td>
                  <td className="px-4 py-3 text-sm text-ink">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-ink">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-ink">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' ? 'bg-primary-100 text-primary-800' : 'bg-surface-2 text-ink-muted'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        className="px-3 py-1.5 text-xs border border-line text-ink font-semibold rounded-lg hover:bg-surface-2 transition-colors flex items-center gap-1"
                        onClick={() => onEditUser(user)}
                      >
                        <Pencil size={12} /> Editar
                      </button>
                      <button
                        className="px-3 py-1.5 text-xs bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors flex items-center gap-1"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        <button
          className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={fetchUsers}
          disabled={loading}
        >
          <RefreshCw size={14} /> Atualizar Lista
        </button>
      </div>
    </div>
  );
};

export default UserList;
