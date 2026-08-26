import React, { ReactNode } from 'react';
import Button from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  message?: string;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

/** Modal de confirmação estilizado — substitui `window.confirm()`, que destoa do tema claro/escuro do app. */
const Modal = ({
  open,
  title,
  message,
  children,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
}: ModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative card p-6 max-w-sm w-full">
        <h3 className="text-base font-semibold text-ink mb-2">{title}</h3>
        {message && <p className="text-sm text-ink-muted mb-6">{message}</p>}
        {children}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          {variant === 'danger' ? (
            <button
              className="px-4 py-2 rounded-xl font-medium transition-colors bg-rose-500 hover:bg-rose-600 text-white"
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          ) : (
            <Button variant="primary" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
