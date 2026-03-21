'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-black uppercase tracking-[0.2em] transition-all disabled:opacity-30 disabled:grayscale cursor-pointer border-2 border-black active:translate-y-1 active:border-b-2';
  
  const variants = {
    primary: 'bg-accent-primary text-black border-b-4 border-black hover:bg-white',
    secondary: 'bg-black text-white border-b-4 border-black hover:bg-accent-primary hover:text-black',
    danger: 'bg-red-600 text-white border-b-4 border-black hover:bg-red-700',
    ghost: 'bg-transparent text-text-primary border-2 border-black hover:bg-black hover:text-white',
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px]',
    md: 'px-8 py-3.5 text-xs',
    lg: 'px-12 py-5 text-sm',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="mr-3 h-4 w-4 border-2 border-current border-t-transparent animate-spin" />
      ) : leftIcon ? (
        <span className="mr-3">{leftIcon}</span>
      ) : null}
      <span className="relative z-10">{children}</span>
      {!isLoading && rightIcon && <span className="ml-3">{rightIcon}</span>}
    </button>
  );
}
