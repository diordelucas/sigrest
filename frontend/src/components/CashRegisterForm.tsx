import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CurrencyInput from './CurrencyInput';
import { formatBRL } from '../utils/currency';
import { CashRegister, CashMovement, CashMovementType } from '../types';
import Button from './ui/Button';
import Field from './ui/Field';
import Modal from './ui/Modal';

interface MovementForm {
  type: CashMovementType;
  amount: number | '';
  description: string;
}

const EMPTY_MOVEMENT: MovementForm = { type: 'EXPENSE', amount: '', description: '' };

type DialogAction = 'open' | 'close' | null;

const CashRegisterForm = () => {
  const { currentUser } = useAuth();
  const [currentCashRegister, setCurrentCashRegister] = useState<CashRegister | null>(null);
  const [openingBalance, setOpeningBalance] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const [movement, setMovement] = useState<MovementForm>(EMPTY_MOVEMENT);
  const [submittingMovement, setSubmittingMovement] = useState(false);
  const [movements, setMovements] = useState<CashMovement[]>([]);

  const fetchCashRegister = useCallback(async (): Promise<CashRegister | null> => {
    try {
      const response = await api.get<CashRegister>('/cash-registers/current-open');
      setCurrentCashRegister(response.data || null);
      return response.data || null;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao carregar status do caixa.'));
      return null;
    }
  }, []);

  const fetchMovements = useCallback(async (cashRegisterId: number) => {
    try {
      const response = await api.get<CashMovement[]>(`/cash-movements/cash-register/${cashRegisterId}`);
      setMovements(response.data || []);
    } catch {
      setMovements([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const register = await fetchCashRegister();
      if (register?.open && register?.id) {
        await fetchMovements(register.id);
      }
      setLoading(false);
    };
    init();
  }, [fetchCashRegister, fetchMovements]);

  const handleOpenCashRegister = () => {
    setDialogAction('open');
    setOpenDialog(true);
  };

  const handleCloseCashRegister = () => {
    setDialogAction('close');
    setOpenDialog(true);
  };

  const confirmAction = async () => {
    setOpenDialog(false);
    setLoading(true);

    try {
      if (dialogAction === 'open') {
        if (!currentUser) {
          toast.error('Sessão inválida. Faça login novamente para abrir o caixa.');
          return;
        }
        const response = await api.post<CashRegister>('/cash-registers/open', {
          openingBalance: Number(openingBalance),
        });
        setCurrentCashRegister(response.data);
        setMovements([]);
        setOpeningBalance('');
        toast.success('Caixa aberto com sucesso!');
      } else if (dialogAction === 'close' && currentCashRegister) {
        const response = await api.post<CashRegister>(`/cash-registers/close/${currentCashRegister.id}`);
        setCurrentCashRegister(response.data);
        setMovements([]);
        toast.success('Caixa fechado com sucesso!');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao processar a operação de caixa.'));
    } finally {
      setLoading(false);
    }
  };

  const handleMovementSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!movement.amount || !currentCashRegister) {
      toast.error('Informe o valor da movimentação.');
      return;
    }
    setSubmittingMovement(true);
    try {
      await api.post('/cash-movements', {
        cashRegisterId: currentCashRegister.id,
        type: movement.type,
        amount: Number(movement.amount),
        description: movement.description || null,
      });
      toast.success('Movimentação registrada!');
      setMovement(EMPTY_MOVEMENT);
      const updated = await fetchCashRegister();
      if (updated?.id) await fetchMovements(updated.id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao registrar movimentação.'));
    } finally {
      setSubmittingMovement(false);
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
    <div className="max-w-2xl mx-auto">
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Controle de Caixa</h2>

        {currentCashRegister && currentCashRegister.open ? (
          <div>
            <div className="mb-4 p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-600 text-sm">
              Caixa atualmente aberto.
            </div>
            <div className="text-sm text-ink-muted space-y-0.5 mb-5">
              <p>
                <span className="font-semibold text-ink">ID:</span> {currentCashRegister.id} &nbsp;|&nbsp;{' '}
                <span className="font-semibold text-ink">Aberto em:</span>{' '}
                {new Date(currentCashRegister.openingTime).toLocaleString()} &nbsp;|&nbsp;{' '}
                <span className="font-semibold text-ink">Operador:</span>{' '}
                {currentCashRegister.openedBy?.name || 'N/A'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="p-3 bg-surface-2 border border-line rounded-xl">
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Saldo Inicial</p>
                <p className="text-base font-bold text-ink">R$ {formatBRL(currentCashRegister.openingBalance ?? 0)}</p>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">+ Vendas</p>
                <p className="text-base font-bold text-emerald-600">R$ {formatBRL(currentCashRegister.salesTotal ?? 0)}</p>
              </div>
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">− Compras</p>
                <p className="text-base font-bold text-rose-600">R$ {formatBRL(currentCashRegister.purchasesTotal ?? 0)}</p>
              </div>
              <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl">
                <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">± Mov. Manuais</p>
                <p className="text-base font-bold text-sky-600">
                  {(currentCashRegister.movementsTotal ?? 0) >= 0 ? '+' : ''}R${' '}
                  {formatBRL(currentCashRegister.movementsTotal ?? 0)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl mb-5 flex items-center justify-between">
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Saldo Atual do Caixa</p>
              <p className="text-2xl font-extrabold text-emerald-600">R$ {formatBRL(currentCashRegister.currentBalance ?? 0)}</p>
            </div>

            <div className="border-t border-line pt-5 mb-5">
              <h3 className="text-sm font-semibold text-ink mb-4">Registrar Movimentação</h3>
              <form onSubmit={handleMovementSubmit}>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Tipo</label>
                    <Field
                      as="select"
                      value={movement.type}
                      onChange={(e) => setMovement({ ...movement, type: e.target.value as CashMovementType })}
                    >
                      <option value="EXPENSE">Saída (Despesa)</option>
                      <option value="INCOME">Entrada</option>
                    </Field>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Valor</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium">R$</span>
                      <CurrencyInput
                        className="input-field pl-8"
                        value={movement.amount}
                        onChange={(val) => setMovement({ ...movement, amount: val })}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Descrição</label>
                    <Field
                      type="text"
                      value={movement.description}
                      onChange={(e) => setMovement({ ...movement, description: e.target.value })}
                      placeholder="Ex: Gás, aluguel..."
                      maxLength={120}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={submittingMovement || !movement.amount}
                  loading={submittingMovement}
                  loadingText="Registrando..."
                >
                  Registrar
                </Button>
              </form>
            </div>

            {movements.length > 0 && (
              <div className="border-t border-line pt-5 mb-5">
                <h3 className="text-sm font-semibold text-ink mb-3">Movimentações deste Caixa</h3>
                <div className="divide-y divide-line max-h-64 overflow-y-auto">
                  {movements.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                      <div className="flex items-center gap-2">
                        {m.type === 'INCOME' ? (
                          <ArrowUpCircle size={16} className="text-emerald-500 shrink-0" />
                        ) : (
                          <ArrowDownCircle size={16} className="text-rose-500 shrink-0" />
                        )}
                        <div>
                          <p className="text-ink">{m.description || '—'}</p>
                          <p className="text-xs text-ink-muted">{new Date(m.date).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className={`font-semibold shrink-0 ml-4 ${m.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {m.type === 'INCOME' ? '+' : '-'}R$ {formatBRL(m.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-line pt-4">
              <button
                className="px-4 py-2 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-colors"
                onClick={handleCloseCashRegister}
              >
                Fechar Caixa
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 text-sm">
              Nenhum caixa está aberto no momento.
            </div>
            <div className="flex flex-col gap-1 mb-6">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Saldo Inicial</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium">R$</span>
                <CurrencyInput
                  data-testid="cash-opening-balance"
                  className="input-field pl-8"
                  value={openingBalance}
                  onChange={setOpeningBalance}
                />
              </div>
            </div>
            <Button
              onClick={handleOpenCashRegister}
              disabled={openingBalance === '' || openingBalance === null}
            >
              Abrir Caixa
            </Button>
          </div>
        )}
      </div>

      <Modal
        open={openDialog}
        title={dialogAction === 'open' ? 'Confirmar Abertura de Caixa' : 'Confirmar Fechamento de Caixa'}
        message={
          dialogAction === 'open'
            ? `Deseja realmente abrir o caixa com saldo inicial de R$ ${formatBRL(openingBalance)}?`
            : `Deseja realmente fechar o caixa ${currentCashRegister?.id}?`
        }
        onCancel={() => {
          setOpenDialog(false);
          setDialogAction(null);
        }}
        onConfirm={confirmAction}
      />
    </div>
  );
};

export default CashRegisterForm;
