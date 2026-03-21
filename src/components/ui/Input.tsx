'use client';

import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="text-[10px] font-black uppercase text-text-secondary tracking-widest ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            w-full border-2 border-black bg-bg-secondary px-4 py-3 text-sm font-bold text-text-primary placeholder-text-secondary/40 outline-none transition-all
            ${error ? 'border-red-600 focus:border-red-600' : 'focus:border-accent-primary'}
            ${className}
          `}
          {...props}
          onChange={(e) => {
            if (e.target.type === 'date' && e.target.value) {
              e.target.blur();
            }
            props.onChange?.(e);
          }}
        />
        {error ? (
          <p className="text-[10px] font-black text-red-600 ml-1 uppercase tracking-tighter">{error}</p>
        ) : helperText ? (
          <p className="text-[10px] text-text-secondary ml-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
