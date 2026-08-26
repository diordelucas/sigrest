import React, { useState, useEffect, FormEvent } from 'react';
import { Search } from 'lucide-react';
import { IMaskInput } from 'react-imask';
import axios from 'axios'; // ViaCEP: API pública de terceiros, não deve levar o token de autenticação
import api, { getErrorMessage } from '../services/api';
import toast from 'react-hot-toast';
import { CNPJ_MASK, PHONE_MASK, CEP_MASK } from '../utils/masks';
import { Supplier } from '../types';

interface SupplierFormProps {
  onSupplierAdded: () => void;
  editingSupplier: Supplier | null;
  onEditComplete: () => void;
}

const SupplierForm = ({ onSupplierAdded, editingSupplier, onEditComplete }: SupplierFormProps) => {
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [registration, setRegistration] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [nbhd, setNbhd] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    if (editingSupplier) {
      setName(editingSupplier.name || '');
      setCnpj(editingSupplier.cnpj || '');
      setPhone(editingSupplier.phone || '');
      setEmail(editingSupplier.email || '');
      setRegistration(editingSupplier.registration || '');
      setCep('');
      setStreet(editingSupplier.street || '');
      setNumber(editingSupplier.number || '');
      setNbhd(editingSupplier.nbhd || '');
      setCity(editingSupplier.city || '');
      setUf(editingSupplier.uf || '');
    }
  }, [editingSupplier]);

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

  const clearForm = () => {
    setName('');
    setCnpj('');
    setPhone('');
    setEmail('');
    setRegistration('');
    setCep('');
    setStreet('');
    setNumber('');
    setNbhd('');
    setCity('');
    setUf('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      cnpj: cnpj.replace(/\D/g, ''),
      phone: phone.replace(/\D/g, ''),
      email,
      registration,
      street,
      number,
      nbhd,
      city,
      uf,
    };
    try {
      if (editingSupplier) {
        await api.put(`/supplier/${editingSupplier.id}`, data);
        toast.success('Fornecedor atualizado com sucesso!');
        clearForm();
        onEditComplete();
      } else {
        await api.post('/supplier', data);
        toast.success('Fornecedor cadastrado com sucesso!');
        clearForm();
        onSupplierAdded();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, editingSupplier ? 'Erro ao atualizar fornecedor.' : 'Erro ao cadastrar fornecedor.'));
    }
  };

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-lg font-semibold text-ink mb-4">
        {editingSupplier ? 'Editar Fornecedor' : 'Cadastro de Fornecedor'}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Nome / Razão Social
            </label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Razão social"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">CNPJ</label>
            <IMaskInput
              mask={CNPJ_MASK}
              value={cnpj}
              onAccept={(value: string) => setCnpj(value)}
              className="input-field"
              placeholder="00.000.000/0000-00"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
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
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Inscrição Estadual
            </label>
            <input
              className="input-field"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              placeholder="Inscrição Estadual"
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
            <input
              className="input-field"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Rua, Avenida..."
            />
          </div>
          <div className="flex flex-col gap-1 w-[110px]">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Número
            </label>
            <input
              className="input-field"
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
            <input
              className="input-field"
              value={nbhd}
              onChange={(e) => setNbhd(e.target.value)}
              placeholder="Bairro"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Cidade
            </label>
            <input
              className="input-field"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Cidade"
            />
          </div>
          <div className="flex flex-col gap-1 w-[80px]">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">UF</label>
            <input
              className="input-field"
              value={uf}
              onChange={(e) => setUf(e.target.value.toUpperCase())}
              maxLength={2}
              placeholder="UF"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            {editingSupplier ? 'Atualizar' : 'Cadastrar'}
          </button>
          {editingSupplier && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                clearForm();
                onEditComplete();
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
