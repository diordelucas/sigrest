import React, { useState, useEffect, FormEvent } from 'react';
import api, { getErrorMessage } from '../services/api';
import { Category } from '../types';
import Button from './ui/Button';
import Field from './ui/Field';

interface CategoryFormProps {
  onCategoryAdded: () => void;
  editingCategory: Category | null;
  onEditComplete: () => void;
}

const CategoryForm = ({ onCategoryAdded, editingCategory, onEditComplete }: CategoryFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name || '');
      setDescription(editingCategory.description || '');
      setError('');
    }
  }, [editingCategory]);

  const clearForm = () => {
    setName('');
    setDescription('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const data = { name, description };
    try {
      if (editingCategory) {
        await api.put(`/category/${editingCategory.id}`, data);
        clearForm();
        onEditComplete();
      } else {
        await api.post('/category', data);
        clearForm();
        onCategoryAdded();
      }
    } catch (error) {
      setError(getErrorMessage(error, editingCategory ? 'Erro ao atualizar categoria.' : 'Erro ao cadastrar categoria.'));
    }
  };

  const handleCancel = () => {
    clearForm();
    if (onEditComplete) onEditComplete();
  };

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-lg font-semibold text-ink mb-4">
        {editingCategory ? 'Editar Categoria' : 'Cadastro de Categoria'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Nome</label>
            <Field
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nome da categoria"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Descrição
            </label>
            <Field
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição (opcional)"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit">{editingCategory ? 'Atualizar' : 'Cadastrar'}</Button>
          {editingCategory && (
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;
