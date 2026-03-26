'use client';

import { getErrorMessage } from '@/content/errors';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { CreditCard, Eye, EyeOff, Lock, Mail, Phone, Trophy, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
  dni: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dni: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        errors[issue.path[0] as string] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: form.name,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        dni: form.dni || undefined,
        phone: form.phone || undefined,
      });
      router.push('/');
    } catch (err: unknown) {
      const error = err as { code?: string };
      setError(getErrorMessage(error.code ?? 'INTERNAL_ERROR'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass = "w-full border-2 border-black bg-white/5 py-4 pl-12 pr-4 text-sm font-bold text-white placeholder-white/10 outline-none transition-all focus:border-accent-primary focus:bg-white/10";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black mesh-bg px-4 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#082032] border-2 border-black p-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-accent-primary" />

        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center border-4 border-black bg-white shadow-lg -rotate-3">
            <Trophy size={32} className="text-black" strokeWidth={3} />
          </div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
            LIGA<span className="text-accent-primary">PRO</span>
          </h1>
          <p className="mt-2 text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Crear Cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="border-l-4 border-red-600 bg-red-600/10 px-6 py-4 text-xs font-black uppercase text-red-500 tracking-widest"
            >
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nombre</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Nombre"
                  className={inputClass}
                />
              </div>
              {fieldErrors['name'] && <p className="text-[10px] font-black text-red-500 uppercase tracking-tighter">{fieldErrors['name']}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Apellido</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary" />
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="Apellido"
                  className={inputClass}
                />
              </div>
              {fieldErrors['lastName'] && <p className="text-[10px] font-black text-red-500 uppercase tracking-tighter">{fieldErrors['lastName']}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="tu@email.com"
                className={inputClass}
              />
            </div>
            {fieldErrors['email'] && <p className="text-[10px] font-black text-red-500 uppercase tracking-tighter">{fieldErrors['email']}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">DNI (opcional)</label>
              <div className="relative">
                <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary" />
                <input
                  type="text"
                  value={form.dni}
                  onChange={(e) => updateField('dni', e.target.value)}
                  placeholder="12345678"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Teléfono (opcional)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary" />
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+54..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors['password'] && <p className="text-[10px] font-black text-red-500 uppercase tracking-tighter">{fieldErrors['password']}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Confirmar Contraseña</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="Repetir contraseña"
                className={inputClass}
              />
            </div>
            {fieldErrors['confirmPassword'] && <p className="text-[10px] font-black text-red-500 uppercase tracking-tighter">{fieldErrors['confirmPassword']}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-5 text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-accent-primary active:translate-y-1 border-b-4 border-accent-primary disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'CREANDO CUENTA...' : 'REGISTRARSE'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-accent-primary hover:underline">
              INICIAR SESIÓN
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
