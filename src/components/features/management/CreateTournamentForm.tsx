'use client';

import { api } from '@/adapters/http';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useScope } from '@/context/ScopeContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const tournamentSchema = z.object({
    name: z.string().min(2, 'El nombre es requerido'),
    description: z.string().optional(),
    dateStart: z.string().min(1, 'La fecha de inicio es requerida'),
    city: z.string().optional(),
    state: z.string().optional(),
    category: z.string().optional(),
    division: z.string().optional(),
    type: z.enum(['LEAGUE', 'ELIMINATION', 'GROUPS_ELIMINATION']),
});

type TournamentFormValues = z.infer<typeof tournamentSchema>;

interface CreateTournamentFormProps {
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export function CreateTournamentForm({ initialData, onSuccess, onCancel }: CreateTournamentFormProps) {
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [divisions, setDivisions] = useState<any[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [states, setStates] = useState<string[]>([]);
    const { user } = useAuth();
    const scope = useScope();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<TournamentFormValues>({
        resolver: zodResolver(tournamentSchema),
        defaultValues: initialData ? {
            ...initialData,
            dateStart: initialData.dateStart ? new Date(initialData.dateStart).toISOString().split('T')[0] : '',
        } : {
            type: 'LEAGUE',
        }
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const [catRes, divRes, cityRes, stateRes] = await Promise.all([
                    api.get('/categories'),
                    api.get('/divisions'),
                    api.get('/cities'),
                    api.get('/states'),
                ]);
                setCategories(catRes.data.data);
                setDivisions(divRes.data.data);

                setCities(cityRes.data.data.map((c: any) => c.name));
                setStates(stateRes.data.data.map((s: any) => s.name));
            } catch (err) {
              
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (!scope.isLoaded || initialData) return;
        if (!scope.shouldShowState()) {
            setValue('state', scope.defaultState);
        }
        if (!scope.shouldShowCity()) {
            setValue('city', scope.defaultCity);
        }
    }, [scope.isLoaded, scope.scopeLevel, scope.defaultState, scope.defaultCity, setValue, initialData]);

    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        api.get('/settings').then(res => setSettings(res.data.data)).catch(console.error);
    }, []);

    const onSubmit = async (data: TournamentFormValues) => {
        setError(null);
        try {
            if (!settings) {
                setError('Cargando configuración, por favor espera un segundo.');
                return;
            }
            const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
            if (!initialData?.id && !isAdmin && settings?.isPaidMode && settings.priceCreateTournament > 0) {
                const confirmed = window.confirm(`Crear este torneo consumirá ${settings.priceCreateTournament} monedas de tu cuenta. ¿Deseas continuar?`);
                if (!confirmed) return;
            }

            await saveTournament(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al guardar el torneo');
        }
    };

    const saveTournament = async (data: TournamentFormValues) => {
        setIsSaving(true);
        try {
            if (initialData?.id) {
                await api.patch(`/tournaments/${initialData.id}`, data);
            } else {
                await api.post('/tournaments', data);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al guardar el torneo');
        } finally {
            setIsSaving(false);
        }
    };



    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
                <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                    {error}
                </div>
            )}

            <Input
                label="Nombre del Torneo *"
                placeholder="Ej: Apertura 2024"
                error={errors.name?.message}
                {...register('name')}
            />

            <Input
                label="Descripción"
                placeholder="Detalles del torneo..."
                error={errors.description?.message}
                {...register('description')}
            />

            <div className="flex flex-col gap-4">
                <Input
                    label="Fecha Inicio *"
                    type="date"
                    error={errors.dateStart?.message}
                    {...register('dateStart')}
                />
            </div>

            {(scope.shouldShowCity() || scope.shouldShowState()) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {scope.shouldShowCity() && (
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1">Ciudad</label>
                    <input
                        list="citiesList"
                        placeholder="Buscar ciudad..."
                        {...register('city')}
                        className={`w-full bg-bg-secondary border-2 ${errors.city ? 'border-red-500' : 'border-black'} p-3 text-text-primary outline-none focus:border-accent-primary transition-colors`}
                    />
                    <datalist id="citiesList">
                        {cities.map(c => (
                            <option key={c} value={c} />
                        ))}
                    </datalist>
                    {errors.city && <span className="text-[10px] text-red-500 px-1">{errors.city.message}</span>}
                </div>
                )}

                {scope.shouldShowState() && (
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1">Provincia</label>
                    <input
                        list="statesList"
                        placeholder="Buscar provincia..."
                        {...register('state')}
                        className={`w-full bg-bg-secondary border-2 ${errors.state ? 'border-red-500' : 'border-black'} p-3 text-text-primary outline-none focus:border-accent-primary transition-colors`}
                    />
                    <datalist id="statesList">
                        {states.map(s => (
                            <option key={s} value={s} />
                        ))}
                    </datalist>
                    {errors.state && <span className="text-[10px] text-red-500 px-1">{errors.state.message}</span>}
                </div>
                )}
            </div>
            )}

            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1">Tipo de Torneo *</label>
                <select
                    {...register('type')}
                    disabled={!!initialData}
                    className="w-full bg-bg-secondary border-2 border-black p-3 text-text-primary appearance-none outline-none focus:border-accent-primary transition-colors disabled:opacity-50"
                >
                    <option value="LEAGUE">Liga (Tabla de Posiciones)</option>
                    <option value="ELIMINATION">Eliminación Directa (Bracket / Playoffs)</option>
                    <option value="GROUPS_ELIMINATION">Grupos + Eliminatorias</option>
                </select>
                {errors.type?.message && <span className="text-[10px] text-red-500 px-1">{errors.type.message}</span>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1">Categoría</label>
                    <input
                        list="categoriesList"
                        placeholder="Buscar categoría..."
                        {...register('category')}
                        className="w-full bg-bg-secondary border-2 border-black p-3 text-text-primary outline-none focus:border-accent-primary transition-colors"
                    />
                    <datalist id="categoriesList">
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name} />
                        ))}
                    </datalist>
                    {errors.category?.message && <span className="text-[10px] text-red-500 px-1">{errors.category.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1">División</label>
                    <input
                        list="divisionsList"
                        placeholder="Buscar división..."
                        {...register('division')}
                        className="w-full bg-bg-secondary border-2 border-black p-3 text-text-primary outline-none focus:border-accent-primary transition-colors"
                    />
                    <datalist id="divisionsList">
                        {divisions.map(div => (
                            <option key={div.id} value={div.name} />
                        ))}
                    </datalist>
                    {errors.division?.message && <span className="text-[10px] text-red-500 px-1">{errors.division.message}</span>}
                </div>
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
                    {initialData ? 'Guardar Cambios' : 'Crear Torneo'}
                </Button>
            </div>
        </form>
    );
}
