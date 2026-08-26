import React, { useState, useEffect, FormEvent } from 'react';
import { Search } from 'lucide-react';
import { IMaskInput } from 'react-imask';
import axios from 'axios'; // ViaCEP: API pública de terceiros, não deve levar o token de autenticação
import api, { getErrorMessage } from '../services/api';
import toast from 'react-hot-toast';
import { CPF_MASK, PHONE_MASK, CEP_MASK } from '../utils/masks';
import { Person } from '../types';
import Button from './ui/Button';
import Field from './ui/Field';

interface PersonFormProps {
  onUserAdded: () => void;
  editingPerson: Person | null;
  onEditComplete: () => void;
}

const PersonForm = ({ onUserAdded, editingPerson, onEditComplete }: PersonFormProps) => {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [nbhd, setNbhd] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    if (editingPerson) {
      setName(editingPerson.name || '');
      setCpf(editingPerson.cpf || '');
      setPhone(editingPerson.phone || '');
      setEmail(editingPerson.email || '');
      setStreet(editingPerson.street || '');
      setNumber(editingPerson.number || '');
      setNbhd(editingPerson.nbhd || '');
      setCity(editingPerson.city || '');
      setUf(editingPerson.uf || '');
    }
  }, [editingPerson]);

  const handleCepBlur = async () => {
    const raw = cep.replace(/\D/g, '');
    if (raw.length !== 8) return;
    setCepLoading(true);
    try {
      const { data } = await axios.get(`https://viacep.com.br/ws/${raw}/json/`);
      if (data.erro) {
        toast.error('CEP não encontrado.');
        return;
      }
      setStreet(data.logradouro || '');
      setNbhd(data.bairro || '');
      setCity(data.localidade || '');
      setUf(data.uf || '');
      toast.success('Endereço preenchido automaticamente!');
    } catch {
      toast.error('Erro ao buscar CEP. Verifique sua conexão.');
    } finally {
      setCepLoading(false);
    }
  };

  const validateForm = () => {
    const rawCpf = cpf.replace(/\D/g, '');
    if (!name || !rawCpf || !phone || !email || !street || !number || !nbhd || !city || !uf) {
      toast.error('Todos os campos são obrigatórios.');
      return false;
    }
    if (rawCpf.length !== 11) {
      toast.error('CPF inválido. Verifique os dígitos.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error('E-mail inválido.');
      return false;
    }
    return true;
  };

  const clearForm = () => {
    setName('');
    setCpf('');
    setPhone('');
    setEmail('');
    setCep('');
    setStreet('');
    setNumber('');
    setNbhd('');
    setCity('');
    setUf('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const personData = {
      name,
      cpf: cpf.replace(/\D/g, ''),
      phone: phone.replace(/\D/g, ''),
      email,
      street,
      number,
      nbhd,
      city,
      uf,
    };

    try {
      if (editingPerson) {
        await api.put(`/person/${editingPerson.id}`, personData);
        toast.success('Cliente atualizado com sucesso!');
        clearForm();
        onEditComplete();
      } else {
        await api.post('/person', personData);
        toast.success('Cliente cadastrado com sucesso!');
        clearForm();
        onUserAdded();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, editingPerson ? 'Erro ao atualizar cliente.' : 'Erro ao cadastrar cliente.'));
    }
  };

  const handleCancel = () => {
    clearForm();
    if (onEditComplete) onEditComplete();
  };

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-lg font-semibold text-ink mb-4">
        {editingPerson ? 'Editar Cliente' : 'Cadastro de Cliente'}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Nome Completo
            </label>
            <Field
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nome completo"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">CPF</label>
            <IMaskInput
              mask={CPF_MASK}
              value={cpf}
              onAccept={(value: string) => setCpf(value)}
              className="input-field"
              placeholder="000.000.000-00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Telefone
            </label>
            <IMaskInput
              mask={PHONE_MASK}
              value={phone}
              onAccept={(value: string) => setPhone(value)}
              className="input-field"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              E-mail
            </label>
            <Field
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
        </div>

        <div className="border-t border-line my-4 flex items-center gap-3">
          <span className="text-xs text-ink-muted font-medium">ENDEREÇO</span>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex flex-col gap-1 w-[180px]">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">CEP</label>
            <div className="relative">
              <IMaskInput
                mask={CEP_MASK}
                value={cep}
                onAccept={(value: string) => setCep(value)}
                onBlur={handleCepBlur}
                className="input-field pr-10"
                placeholder="00000-000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
                {cepLoading ? (
                  <div className="w-4 h-4 border-2 border-line border-t-primary-500 rounded-full animate-spin" />
                ) : (
                  <Search size={14} />
                )}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Rua / Logradouro
            </label>
            <Field
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Rua, Avenida..."
            />
          </div>
          <div className="flex flex-col gap-1 w-[110px]">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Número
            </label>
            <Field
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Nº"
            />
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex flex-col gap-1 flex-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Bairro
            </label>
            <Field
              value={nbhd}
              onChange={(e) => setNbhd(e.target.value)}
              placeholder="Bairro"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Cidade
            </label>
            <Field
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Cidade"
            />
          </div>
          <div className="flex flex-col gap-1 w-[80px]">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">UF</label>
            <Field
              value={uf}
              onChange={(e) => setUf(e.target.value.toUpperCase())}
              maxLength={2}
              placeholder="UF"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit">{editingPerson ? 'Atualizar' : 'Cadastrar'}</Button>
          {editingPerson && (
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PersonForm;
