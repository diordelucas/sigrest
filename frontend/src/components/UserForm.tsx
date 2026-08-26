import React, { useState, useEffect, FormEvent } from 'react';
import api, { getErrorMessage } from '../services/api';
import { User, UserRole } from '../types';
import Button from './ui/Button';
import Field from './ui/Field';

interface UserFormProps {
  onUserAdded: () => void;
  editingUser: User | null;
  onEditComplete: () => void;
}

const UserForm = ({ onUserAdded, editingUser, onEditComplete }: UserFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('OPERADOR');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name || '');
      setEmail(editingUser.email || '');
      setRole(editingUser.role || 'OPERADOR');
      setPassword('');
      setError('');
    }
  }, [editingUser]);

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('OPERADOR');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const userData = { name, email, password, role };
    try {
      if (editingUser) {
        setError('Edição de usuário requer um endpoint específico na API (PUT).');
      } else {
        await api.post('/user/signup', userData);
        clearForm();
        onUserAdded();
      }
    } catch (error) {
      setError(getErrorMessage(error, editingUser ? 'Erro ao atualizar usuário.' : 'Erro ao cadastrar usuário.'));
    }
  };

  const handleCancel = () => {
    clearForm();
    if (onEditComplete) onEditComplete();
  };

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-lg font-semibold text-ink mb-4">
        {editingUser ? 'Editar Usuário' : 'Cadastro de Usuário'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Nome</label>
            <Field
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nome completo"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Email</label>
            <Field
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@exemplo.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Senha</label>
            <Field
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!editingUser}
              placeholder="••••••••"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Nível de Acesso
            </label>
            <Field
              as="select"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="ADMIN">Administrador</option>
              <option value="OPERADOR">Operador</option>
            </Field>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit">{editingUser ? 'Atualizar' : 'Cadastrar'}</Button>
          {editingUser && (
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserForm;
