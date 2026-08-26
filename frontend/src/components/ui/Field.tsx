import React, { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type FieldProps =
  | ({ as?: 'input' } & InputHTMLAttributes<HTMLInputElement>)
  | ({ as: 'select' } & SelectHTMLAttributes<HTMLSelectElement>)
  | ({ as: 'textarea' } & TextareaHTMLAttributes<HTMLTextAreaElement>);

/** Encapsula `.input-field` (ver index.css) — evita repetir a classe em cada tela. */
const Field = (props: FieldProps) => {
  const { as = 'input', className = '', ...rest } = props as FieldProps & { className?: string };
  const classes = `input-field ${as === 'select' ? 'appearance-none' : ''} ${className}`.trim();

  if (as === 'select') {
    return <select className={classes} {...(rest as SelectHTMLAttributes<HTMLSelectElement>)} />;
  }
  if (as === 'textarea') {
    return <textarea className={classes} {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} />;
  }
  return <input className={classes} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />;
};

export default Field;
