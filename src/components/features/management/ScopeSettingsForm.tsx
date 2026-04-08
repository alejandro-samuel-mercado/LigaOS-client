'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { api } from '@/adapters/http';
import { useAlert } from '@/context/AlertContext';
import { useScope } from '@/context/ScopeContext';
import { Globe, Map, MapPin, Home } from 'lucide-react';

const SCOPE_OPTIONS = [
  { value: 'GLOBAL', label: 'Global', icon: Globe, desc: 'Se gestionan países, estados y ciudades. Todo visible.' },
  { value: 'NATIONAL', label: 'Nacional', icon: Map, desc: 'Solo estados/provincias de un país de origen.' },
  { value: 'STATE', label: 'Estatal', icon: MapPin, desc: 'Solo ciudades de un estado/provincia de origen.' },
  { value: 'LOCAL', label: 'Local', icon: Home, desc: 'Una sola ciudad. Equipos y jugadores locales.' },
];

interface ScopeSettingsFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ScopeSettingsForm({ onSuccess, onCancel }: ScopeSettingsFormProps) {
  const { error: alertError, success: alertSuccess } = useAlert();
  const scope = useScope();
  const [scopeLevel, setScopeLevel] = useState<string>('LOCAL');
  const [defaultCountry, setDefaultCountry] = useState('');
  const [defaultState, setDefaultState] = useState('');
  const [defaultCity, setDefaultCity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (scope.isLoaded) {
      setScopeLevel(scope.scopeLevel);
      setDefaultCountry(scope.defaultCountry);
      setDefaultState(scope.defaultState);
      setDefaultCity(scope.defaultCity);
    }
  }, [scope.isLoaded, scope.scopeLevel, scope.defaultCountry, scope.defaultState, scope.defaultCity]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/settings', { scopeLevel, defaultCountry, defaultState, defaultCity });
      alertSuccess('Configuración de alcance guardada');
      await scope.reload();
      onSuccess();
    } catch (err: any) {
      alertError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1">Alcance del Sistema</label>
        <div className="grid grid-cols-2 gap-2">
          {SCOPE_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isActive = scopeLevel === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setScopeLevel(opt.value)}
                className={`flex flex-col items-start gap-1.5 p-3 border-2 text-left transition-all ${isActive ? 'border-accent-primary bg-accent-primary/10' : 'border-border-subtle hover:border-text-secondary'}`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} className={isActive ? 'text-accent-primary' : 'text-text-secondary'} />
                  <span className={`text-xs font-black uppercase ${isActive ? 'text-accent-primary' : 'text-text-primary'}`}>{opt.label}</span>
                </div>
                <span className="text-[10px] text-text-secondary leading-tight">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1">Ubicación de Origen</label>
        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-text-secondary px-1">País</label>
            <input
              value={defaultCountry}
              onChange={e => setDefaultCountry(e.target.value)}
              className="w-full bg-bg-secondary border-2 border-black p-3 text-text-primary outline-none focus:border-accent-primary transition-colors text-sm"
              placeholder="Ej: Argentina"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-text-secondary px-1">Provincia / Estado</label>
            <input
              value={defaultState}
              onChange={e => setDefaultState(e.target.value)}
              className="w-full bg-bg-secondary border-2 border-black p-3 text-text-primary outline-none focus:border-accent-primary transition-colors text-sm"
              placeholder="Ej: Buenos Aires"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-text-secondary px-1">Ciudad</label>
            <input
              value={defaultCity}
              onChange={e => setDefaultCity(e.target.value)}
              className="w-full bg-bg-secondary border-2 border-black p-3 text-text-primary outline-none focus:border-accent-primary transition-colors text-sm"
              placeholder="Ej: Capital Federal"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={handleSave} isLoading={saving} className="flex-1">
          Guardar
        </Button>
      </div>
    </div>
  );
}
