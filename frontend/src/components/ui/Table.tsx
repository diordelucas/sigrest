import React, { ReactNode, ThHTMLAttributes } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

/** Encapsula o wrapper `overflow-x-auto` + `<table className="w-full">` repetido em toda tela de lista. */
export const Table = ({ children, className = '' }: TableProps) => (
  <div className={`overflow-x-auto ${className}`.trim()}>
    <table className="w-full">{children}</table>
  </div>
);

/** Encapsula o cabeçalho de coluna padrão (`px-4 py-3 text-left text-xs font-semibold ...`). */
export const Th = ({ className = '', children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={`px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider ${className}`.trim()}
    {...rest}
  >
    {children}
  </th>
);
