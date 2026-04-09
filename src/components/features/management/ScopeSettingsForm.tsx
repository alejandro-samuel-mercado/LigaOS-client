import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { api } from '@/adapters/http';
import { useAlert } from '@/context/AlertContext';
import { useScope } from '@/context/ScopeContext';
import { Globe, Map, MapPin, Home } from 'lucide-react';
import { Autocomplete } from '@/components/ui/Autocomplete';

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
  const [countryId, setCountryId] = useState('');
  
  const [defaultState, setDefaultState] = useState('');
  const [stateId, setStateId] = useState('');
  
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
      await api.patch('/settings', { 
        scopeLevel, 
        defaultCountry, 
        defaultState, 
        defaultCity 
      });
      alertSuccess('Configuración de alcance guardada');
      await scope.reload();
      onSuccess();
    } catch (err: any) {
      alertError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const searchCountries = async (query: string) => {
    const res = await api.get('/countries');
    const all = res.data.data;
    return all.filter((c: any) => c.name.toLowerCase().includes(query.toLowerCase()));
  };

  const searchStates = async (query: string) => {
    if (!countryId) return [];
    const res = await api.get(`/states?countryId=${countryId}`);
    const all = res.data.data;
    return all.filter((s: any) => s.name.toLowerCase().includes(query.toLowerCase()));
  };

  const searchCities = async (query: string) => {
    if (!stateId) return [];
    const res = await api.get(`/cities?stateId=${stateId}`);
    const all = res.data.data;
    return all.filter((c: any) => c.name.toLowerCase().includes(query.toLowerCase()));
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
          
          <Autocomplete 
            label="País"
            value={defaultCountry}
            placeholder="Selecciona país"
            onSelect={(name, id) => {
               setDefaultCountry(name);
               setCountryId(id);
               setDefaultState('');
               setStateId('');
               setDefaultCity('');
            }}
            onSearch={searchCountries}
          />

          <Autocomplete 
            label="Provincia / Estado"
            value={defaultState}
            placeholder={countryId ? "Selecciona provincia" : "Primero selecciona un país"}
            disabled={!countryId && !defaultState}
            onSelect={(name, id) => {
               setDefaultState(name);
               setStateId(id);
               setDefaultCity('');
            }}
            onSearch={searchStates}
          />

          <Autocomplete 
            label="Ciudad"
            value={defaultCity}
            placeholder={stateId ? "Selecciona ciudad" : "Primero selecciona una provincia"}
            disabled={!stateId && !defaultCity}
            onSelect={(name, id) => {
               setDefaultCity(name);
            }}
            onSearch={searchCities}
          />

        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-4px] hover:translate-y-0 transition-all">
          Cancelar
        </Button>
        <Button onClick={handleSave} isLoading={saving} className="flex-1 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-4px] hover:translate-y-0 transition-all">
          Guardar
        </Button>
      </div>
    </div>
  );
}
