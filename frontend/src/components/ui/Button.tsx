import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  loadingText?: ReactNode;
}

/** Encapsula `.btn-primary`/`.btn-secondary` (ver index.css) — evita repetir a classe em cada tela. */
const Button = ({
  variant = 'primary',
  loading = false,
  loadingText = 'Salvando...',
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) => {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  return (
    <button
      className={`${base} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`.trim()}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
