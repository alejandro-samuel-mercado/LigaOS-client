'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/adapters/http';
import { useState } from 'react';

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre es requerido'),
  lastName: z.string().min(2, 'El apellido es requerido'),
  dni: z.string().optional(),
  phone: z.string().optional(),
  birthdate: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  role: z.enum(['PLAYER', 'REFEREE', 'COACH', 'PRESIDENT']),
});

type UserFormValues = z.infer<typeof userSchema>;

interface CreateUserFormProps {
    role: 'USER' | 'PLAYER' | 'REFEREE' | 'COACH' | 'PRESIDENT' | 'STAFF' | string;
    onSuccess: () => void;
  onCancel: () => void;
}

export function CreateUserForm({ role, onSuccess, onCancel }: CreateUserFormProps) {
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: role as any,
      country: 'Argentina',
    },
  });

  const onSubmit = async (data: any) => {
    setError(null);
    try {
      const payload = {
        ...data,
        birthdate: data.birthdate ? new Date(data.birthdate).toISOString() : undefined,
      };
      await api.post('/users', payload);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el usuario');
    }
  };

  const roleLabels: any = {
    PLAYER: 'Jugador',
    REFEREE: 'Árbitro',
    COACH: 'Director Técnico',
    PRESIDENT: 'Presidente',
  };
  const roleLabel = roleLabels[role as string] || role;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nombre *"
          placeholder="Ej: Juan"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Apellido *"
          placeholder="Ej: Pérez"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>

      <Input
        label="Email *"
        type="email"
        placeholder="juan.perez@ejemplo.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Contraseña Temporal *"
        type="password"
        placeholder="Min. 6 caracteres"
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="DNI"
          placeholder="Sin puntos ni espacios"
          error={errors.dni?.message}
          {...register('dni')}
        />
        <Input
          label="Teléfono"
          placeholder="Ej: 1122334455"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>

      <Input
        label="Fecha de Nacimiento"
        type="date"
        error={errors.birthdate?.message}
        {...register('birthdate')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Barrio"
          placeholder="Ej: Centro"
          error={errors.district?.message}
          {...register('district')}
        />
        <Input
          label="Ciudad"
          placeholder="Ej: Capital"
          error={errors.city?.message}
          {...register('city')}
        />
        <Input
          label="Provincia"
          placeholder="Ej: Buenos Aires"
          error={errors.state?.message}
          {...register('state')}
        />
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="flex-1"
        >
          Inscribir {roleLabel[role as string] || 'Miembro'}
        </Button>
      </div>
    </form>
  );
}
