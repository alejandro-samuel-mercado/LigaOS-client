'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Camera, Eye, EyeOff, ChevronRight, Lock, Shield, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';
import { ROLE_LABELS } from '@/content/roles';
import { api } from '@/adapters/http';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useRef } from 'react';

const PRIVACY_FIELDS = [
    { id: 'name', label: 'Nombre' },
    { id: 'lastName', label: 'Apellido' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Teléfono' },
    { id: 'dni', label: 'DNI' },
    { id: 'birthdate', label: 'Fecha de Nacimiento' },
    { id: 'image', label: 'Foto de Perfil' },
];

export default function ProfilePage() {
    const { user, isAuthenticated, isLoading, logout, checkAuth } = useAuth();
    const router = useRouter();
    const { success, error } = useAlert();
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [publicFields, setPublicFields] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setPublicFields(user.publicFields || ['name', 'lastName', 'image']);
        }
    }, [user]);

    if (isLoading) {
        return (
            <div className="space-y-4 px-4 py-4">
                <div className="skeleton h-32 w-full" />
                <div className="skeleton h-48 w-full shadow-lg" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        router.push('/login');
        return null;
    }

    const handleToggleField = (fieldId: string) => {
        setPublicFields(prev =>
            prev.includes(fieldId)
                ? prev.filter(f => f !== fieldId)
                : [...prev, fieldId]
        );
    };

    const handleSavePrivacy = async () => {
        setSaving(true);
        try {
            await api.patch('/auth/me', { publicFields });
            await checkAuth(); // Refetch user data
            setIsPrivacyModalOpen(false);
            success('Ajustes de privacidad guardados');
        } catch (err) {
            error('Error al guardar ajustes');
        } finally {
            setSaving(false);
        }
    };

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
            const imageUrl = res.data.data.url;
            await api.patch('/auth/me', { image: imageUrl });
            await checkAuth();
            success('Foto de perfil actualizada con éxito');
        } catch (err: any) {
            error(err.response?.data?.message || 'Error al actualizar la foto de perfil');
        } finally {
            setUploadingImage(false);
        }
    };

    async function handleLogout() {
        await logout();
        router.push('/login');
    }

    return (
        <div className="main-container px-6 py-12 pb-40 space-y-12 bg-bg-primary mesh-bg min-h-screen">
            <div className="flex items-end justify-between border-b-8 border-black pb-4">
                <h1 className="text-5xl font-black text-text-primary tracking-tighter uppercase leading-none italic">PERFIL</h1>
                <div className="h-4 w-24 bg-accent-primary" />
            </div>

            {/* Avatar & Info */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col md:flex-row items-center md:items-end gap-10 bg-bg-card border-4 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Shield size={200} strokeWidth={1} />
                </div>

                <div className="relative shrink-0">
                    <div className="flex h-40 w-40 items-center justify-center border-8 border-black bg-black text-5xl font-black text-white shadow-2xl -rotate-3 group-hover:rotate-0 transition-transform overflow-hidden">
                        {user.image ? (
                            <img src={user.image} alt="" className="h-full w-full object-cover grayscale hover:grayscale-0 transition-grayscale" />
                        ) : (
                            <span className="italic">{user.name[0]}{user.lastName[0]}</span>
                        )}
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={uploadingImage}
                        className={`absolute -bottom-4 -right-4 flex h-14 w-14 items-center justify-center border-4 border-black bg-accent-primary text-black shadow-xl hover:scale-110 active:scale-95 transition-all ${uploadingImage ? 'opacity-50' : ''}`}
                    >
                        <Camera size={24} strokeWidth={3} className={uploadingImage ? 'animate-pulse' : ''} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageChange} 
                        accept="image/*" 
                        className="hidden" 
                    />
                </div>

                <div className="text-center md:text-left space-y-4 flex-1">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-primary italic">Atleta Verificado</p>
                        <h2 className="text-5xl font-black text-text-primary uppercase italic tracking-tighter leading-none">{user.name} {user.lastName}</h2>
                    </div>
                    <div className="inline-block px-6 py-2 bg-black text-white border-b-4 border-accent-primary">
                        <p className="text-xs font-black uppercase tracking-[0.2em] italic">{ROLE_LABELS[user.role] ?? user.role}</p>
                    </div>
                </div>
            </motion.div>

            {/* Settings Menu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PRESIDENT') && (
                    <button
                        onClick={() => router.push('/management')}
                        className="flex w-full items-center justify-between p-8 bg-black text-white border-2 border-black hover:bg-accent-primary hover:text-black transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 group"
                    >
                        <div className="flex items-center gap-6">
                            <Shield size={32} className="text-accent-primary group-hover:text-black transition-colors" strokeWidth={3} />
                            <div className="text-left space-y-1">
                                <span className="block font-black uppercase text-xl italic tracking-tighter">Panel de Gestión</span>
                                <span className="text-[10px] opacity-60 uppercase font-black tracking-widest block">Acceso Administrativo</span>
                            </div>
                        </div>
                        <ChevronRight size={24} strokeWidth={3} />
                    </button>
                )}

                <button className="flex w-full items-center justify-between p-8 bg-bg-card border-2 border-black hover:bg-bg-secondary transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 group">
                    <div className="flex items-center gap-6">
                        <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">✏️</div>
                        <div className="text-left space-y-1">
                            <span className="block font-black uppercase text-xl italic tracking-tighter">Editar Perfil</span>
                            <span className="text-[10px] opacity-40 uppercase font-black tracking-widest block">Actualizar Información</span>
                        </div>
                    </div>
                    <ChevronRight size={24} strokeWidth={3} />
                </button>

                <button
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="flex w-full items-center justify-between p-8 bg-bg-card border-2 border-black hover:bg-bg-secondary transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 group"
                >
                    <div className="flex items-center gap-6">
                        <Lock size={32} className="text-accent-primary group-hover:scale-110 transition-transform" strokeWidth={3} />
                        <div className="text-left space-y-1">
                            <span className="block font-black uppercase text-xl italic tracking-tighter">Seguridad</span>
                            <span className="text-[10px] text-accent-primary font-black uppercase tracking-widest block">Protección Activa</span>
                        </div>
                    </div>
                    <ChevronRight size={24} strokeWidth={3} />
                </button>

                <button className="flex w-full items-center justify-between p-8 bg-bg-card border-2 border-black hover:bg-bg-secondary transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 group">
                    <div className="flex items-center gap-6">
                        <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">📊</div>
                        <div className="text-left space-y-1">
                            <span className="block font-black uppercase text-xl italic tracking-tighter">Estadísticas</span>
                            <span className="text-[10px] opacity-40 uppercase font-black tracking-widest block">Rendimiento Histórico</span>
                        </div>
                    </div>
                    <ChevronRight size={24} strokeWidth={3} />
                </button>

                <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-4 p-8 bg-black text-white border-2 border-black border-l-8 border-l-red-600 hover:bg-red-600 transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1"
                >
                    <LogOut size={24} strokeWidth={3} />
                    <span className="font-black uppercase text-xl italic tracking-tighter">Cerrar Sesión</span>
                </button>
            </div>

            {/* Privacy Modal */}
            <Modal
                isOpen={isPrivacyModalOpen}
                onClose={() => setIsPrivacyModalOpen(false)}
                title="Ajustes de Privacidad"
            >
                <div className="space-y-6">
                    <p className="text-xs text-text-secondary">
                        Selecciona qué información quieres que sea visible públicamente.
                        <span className="block mt-1 text-accent-primary/70 italic">* Nota: Admins y DTs siempre verán tu info completa.</span>
                    </p>

                    <div className="space-y-2">
                        {PRIVACY_FIELDS.map(field => (
                            <button
                                key={field.id}
                                onClick={() => handleToggleField(field.id)}
                                className={`flex w-full items-center justify-between p-4 border-2 transition-all ${publicFields.includes(field.id)
                                    ? 'bg-accent-primary/10 border-accent-primary text-text-primary'
                                    : 'bg-bg-secondary border-border-subtle text-text-secondary'
                                    }`}
                            >
                                <span className="font-bold text-sm">{field.label}</span>
                                {publicFields.includes(field.id) ? (
                                    <div className="flex items-center gap-2 text-accent-primary">
                                        <span className="text-[10px] font-bold uppercase">Visible</span>
                                        <Eye size={16} />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase">Oculto</span>
                                        <EyeOff size={16} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <Button variant="ghost" className="flex-1" onClick={() => setIsPrivacyModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button className="flex-1" onClick={handleSavePrivacy} disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
