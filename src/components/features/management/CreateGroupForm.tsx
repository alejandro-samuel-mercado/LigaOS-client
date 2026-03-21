'use client';

import { useState } from 'react';
import { api } from '@/adapters/http';
import { useAlert } from '@/context/AlertContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CreateGroupFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateGroupForm({ onSuccess, onCancel }: CreateGroupFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useAlert();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/groups', { name, description });
      success('Grupo creado exitosamente');
      onSuccess();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al crear grupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre del Grupo"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej: Grupo de Whats, Comisión directiva, etc."
      />
      <div className="space-y-2">
        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
          Descripción (Opcional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-bg-secondary border-2 border-black px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-primary resize-none"
          rows={3}
          placeholder="Pequeña descripción del propósito del grupo..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
        <Button variant="ghost" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Grupo'}
        </Button>
      </div>
    </form>
  );
}
