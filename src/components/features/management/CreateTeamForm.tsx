'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/adapters/http';
import { useAlert } from '@/context/AlertContext';
import { useRef, useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

const teamSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    nameShort: z.string().max(20, 'Máximo 20 caracteres').optional(),
    description: z.string().max(500, 'Máximo 500 caracteres').optional(),
    logo: z.string().optional(),
    city: z.string().min(2, 'La ciudad es requerida'),
    state: z.string().min(2, 'La provincia es requerida'),
    country: z.string().min(2, 'El país es requerido'),
    stadium: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    category: z.string().optional(),
    division: z.string().optional(),
    colorPrimary: z.string().optional(),
    colorSecondary: z.string().optional(),
    colorTertiary: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

interface CreateTeamFormProps {
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export function CreateTeamForm({ initialData, onSuccess, onCancel }: CreateTeamFormProps) {
    const { success: successAlert, error: errorAlert } = useAlert();
    const [categories, setCategories] = useState<any[]>([]);
    const [divisions, setDivisions] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [states, setStates] = useState<any[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<TeamFormValues>({
        resolver: zodResolver(teamSchema),
        defaultValues: initialData || {
            country: 'Argentina',
        },
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
                setCities(cityRes.data.data);
                setStates(stateRes.data.data);
            } catch (err) {
                console.error('Error fetching categories/divisions:', err);
            }
        }
        fetchData();
    }, []);

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
            setValue('logo', res.data.data.url);
            successAlert('Logo subido y listo para guardar');
        } catch (err: any) {
            errorAlert(err.response?.data?.message || 'Error al subir la imagen');
        } finally {
            setUploadingImage(false);
        }
    };

    const onSubmit = async (data: TeamFormValues) => {
        try {
            if (initialData?.id) {
                await api.put(`/teams/${initialData.id}`, data);
            } else {
                await api.post('/teams', data);
            }
            onSuccess();
        } catch (err: any) {
            errorAlert(err.response?.data?.message || 'Error al guardar el equipo');
        }
    };

    const currentLogo = watch('logo');

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col items-center gap-4 mb-4">
                <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1 self-start">Escudo del Equipo</label>
                <div className="relative group">
                    <div className="h-24 w-24 bg-black border-4 border-bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                        {currentLogo ? (
                            <img src={currentLogo} alt="Logo" className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-[10px] uppercase font-bold text-text-secondary opacity-50">Logo</span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className={`absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center border-2 border-black bg-accent-primary text-black shadow-md hover:scale-110 active:scale-95 transition-all ${uploadingImage ? 'opacity-50' : ''}`}
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
                    label="Nombre del equipo *"
                    placeholder="Ej: Los Galácticos"
                    error={errors.name?.message}
                    {...register('name')}
                />
                <Input
                    label="Nombre corto (Siglas)"
                    placeholder="Ej: GAL"
                    error={errors.nameShort?.message}
                    {...register('nameShort')}
                />
            </div>

            <Input
                label="Descripción"
                placeholder="Breve historia o lema del equipo"
                error={errors.description?.message}
                {...register('description')}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1">Ciudad *</label>
                    <input
                        list="teamCitiesList"
                        placeholder="Buscar ciudad..."
                        {...register('city')}
                        className={`w-full bg-bg-secondary border-2 ${errors.city ? 'border-red-500' : 'border-black'} p-3 text-text-primary outline-none focus:border-accent-primary transition-colors`}
                    />
                    <datalist id="teamCitiesList">
                        {cities.map(c => (
                            <option key={c.id} value={c.name} />
                        ))}
                    </datalist>
                    {errors.city && <span className="text-[10px] text-red-500 px-1">{errors.city.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1">Provincia *</label>
                    <input
                        list="teamStatesList"
                        placeholder="Buscar provincia..."
                        {...register('state')}
                        className={`w-full bg-bg-secondary border-2 ${errors.state ? 'border-red-500' : 'border-black'} p-3 text-text-primary outline-none focus:border-accent-primary transition-colors`}
                    />
                    <datalist id="teamStatesList">
                        {states.map(s => (
                            <option key={s.id} value={s.name} />
                        ))}
                    </datalist>
                    {errors.state && <span className="text-[10px] text-red-500 px-1">{errors.state.message}</span>}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="Estadio / Sede"
                    placeholder="Ej: Estadio Municipal"
                    error={errors.stadium?.message}
                    {...register('stadium')}
                />
                <Input
                    label="Teléfono de Contacto"
                    placeholder="Ej: 1122334455"
                    error={errors.phone?.message}
                    {...register('phone')}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="Email de Contacto"
                    type="email"
                    placeholder="equipo@ejemplo.com"
                    error={errors.email?.message}
                    {...register('email')}
                />
                <Input
                    label="Instagram"
                    placeholder="Ej: @losequipos"
                    error={errors.instagram?.message}
                    {...register('instagram')}
                />
            </div>

            <Input
                label="Facebook"
                placeholder="Link o nombre de página"
                error={errors.facebook?.message}
                {...register('facebook')}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1">Categoría</label>
                    <input
                        list="teamCategoriesList"
                        placeholder="Buscar categoría..."
                        {...register('category')}
                        className="w-full bg-bg-secondary border-2 border-black p-3 text-text-primary outline-none focus:border-accent-primary transition-colors"
                    />
                    <datalist id="teamCategoriesList">
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name} />
                        ))}
                    </datalist>
                    {errors.category?.message && <span className="text-[10px] text-red-500 px-1">{errors.category.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest px-1">División</label>
                    <input
                        list="teamDivisionsList"
                        placeholder="Buscar división..."
                        {...register('division')}
                        className="w-full bg-bg-secondary border-2 border-black p-3 text-text-primary outline-none focus:border-accent-primary transition-colors"
                    />
                    <datalist id="teamDivisionsList">
                        {divisions.map(div => (
                            <option key={div.id} value={div.name} />
                        ))}
                    </datalist>
                    {errors.division?.message && <span className="text-[10px] text-red-500 px-1">{errors.division.message}</span>}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input
                    label="Color Principal"
                    type="color"
                    className="h-12 p-1 pt-8"
                    error={errors.colorPrimary?.message}
                    {...register('colorPrimary')}
                />
                <Input
                    label="Color Secundario"
                    type="color"
                    className="h-12 p-1 pt-8"
                    error={errors.colorSecondary?.message}
                    {...register('colorSecondary')}
                />
                <Input
                    label="Color Terciario"
                    type="color"
                    className="h-12 p-1 pt-8"
                    error={errors.colorTertiary?.message}
                    {...register('colorTertiary')}
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
                    {initialData?.id ? 'Guardar Cambios' : 'Crear Equipo'}
                </Button>
            </div>
        </form>
    );
}
