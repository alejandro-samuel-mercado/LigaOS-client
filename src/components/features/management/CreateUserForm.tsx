'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/adapters/http';
import { useState, useRef, useEffect } from 'react';
import { Camera, User } from 'lucide-react';
import { useAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';
import { useScope } from '@/context/ScopeContext';

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
  image: z.string().optional(),
  role: z.enum(['PLAYER', 'REFEREE', 'COACH', 'PRESIDENT']),
});

type UserFormValues = z.infer<typeof userSchema>;

interface CreateUserFormProps {
    role: 'USER' | 'PLAYER' | 'REFEREE' | 'COACH' | 'PRESIDENT' | 'STAFF' | string;
    onSuccess: () => void;
  onCancel: () => void;
}

export function CreateUserForm({ role, onSuccess, onCancel }: CreateUserFormProps) {
  const { error: alertError, success: alertSuccess } = useAlert();
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const scope = useScope();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: role as any,
      country: scope.defaultCountry || 'Argentina',
      state: !scope.shouldShowState() ? scope.defaultState : '',
      city: !scope.shouldShowCity() ? scope.defaultCity : '',
    },
  });

  useEffect(() => {
    if (!scope.isLoaded) return;
    if (!scope.shouldShowCountry()) {
      setValue('country', scope.defaultCountry);
    }
    if (!scope.shouldShowState()) {
      setValue('state', scope.defaultState);
    }
    if (!scope.shouldShowCity()) {
      setValue('city', scope.defaultCity);
    }
  }, [scope.isLoaded, scope.scopeLevel, scope.defaultCountry, scope.defaultState, scope.defaultCity, setValue]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        setValue('image', res.data.data.url);
        alertSuccess('Foto subida correctamente');
    } catch (err: any) {
        alertError(err.response?.data?.message || 'Error al subir la foto');
    } finally {
        setUploadingImage(false);
    }
  };

  const currentImage = watch('image');

  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    api.get('/settings').then(res => setSettings(res.data.data)).catch(console.error);
  }, []);

  const onSubmit = async (data: UserFormValues) => {
    setError(null);
    try {
      if (!settings) {
          setError('Cargando configuración, por favor espera un segundo.');
          return;
      }
      const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
      if (!isAdmin && role === 'PLAYER' && settings?.isPaidMode && settings.priceRegisterPlayer > 0) {
        const confirmed = window.confirm(`Inscribir este jugador consumirá ${settings.priceRegisterPlayer} monedas de tu cuenta. ¿Deseas continuar?`);
        if (!confirmed) return;
      }

      await saveUser(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el usuario');
    }
  };

  const saveUser = async (data: any) => {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        birthdate: data.birthdate ? new Date(data.birthdate).toISOString() : undefined,
      };
      await api.post('/users', payload);
      onSuccess();
    } catch (err: any) {
        setError(err.response?.data?.message || 'Error al crear el usuario');
    } finally {
        setIsSaving(false);
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

      {/* Profile Photo */}
      <div className="flex flex-col items-center gap-4 mb-6">
          <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1 self-start">Foto de Perfil</label>
          <div className="relative group">
              <div className="h-24 w-24 bg-black border-4 border-bg-secondary flex items-center justify-center overflow-hidden rounded-full shrink-0">
                  {currentImage ? (
                      <img src={currentImage} alt="Perfil" className="h-full w-full object-cover" />
                  ) : (
                      <User size={40} className="text-text-secondary opacity-20" />
                  )}
              </div>
              <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className={`absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center border-2 border-black bg-accent-primary text-black rounded-full shadow-md hover:scale-110 active:scale-95 transition-all ${uploadingImage ? 'opacity-50' : ''}`}
              >
                  <Camera size={14} strokeWidth={3} className={uploadingImage ? 'animate-pulse' : ''} />
              </button>
              <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
              />
          </div>
      </div>

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
        {scope.shouldShowCity() && (
        <Input
          label="Ciudad"
          placeholder="Ej: Capital"
          error={errors.city?.message}
          {...register('city')}
        />
        )}
        {scope.shouldShowState() && (
        <Input
          label="Provincia"
          placeholder="Ej: Buenos Aires"
          error={errors.state?.message}
          {...register('state')}
        />
        )}
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
          Inscribir {roleLabels[role as string] || 'Miembro'}
        </Button>
      </div>
    </form>
  );
}
