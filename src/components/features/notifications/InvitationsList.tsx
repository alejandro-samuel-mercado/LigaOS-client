'use client';

import { useEffect, useState } from 'react';
import { api } from '@/adapters/http';
import { useAlert } from '@/context/AlertContext';
import { Check, X, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function InvitationsList() {
    const { success, error: showError } = useAlert();
    const [invitations, setInvitations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInvitations = async () => {
        try {
            const { data } = await api.get('/invitations/received?status=PENDING');
            setInvitations(data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    const handleAction = async (id: string, action: 'accept' | 'reject') => {
        try {
            await api.patch(`/invitations/${id}/${action}`);
            success(action === 'accept' ? 'Invitación aceptada. ¡Bienvenido al equipo!' : 'Invitación rechazada.');
            fetchInvitations();
        } catch (err: any) {
            showError(err.response?.data?.message || `Error al ${action === 'accept' ? 'aceptar' : 'rechazar'} la invitación`);
        }
    };

    if (loading) return null;
    if (invitations.length === 0) return null;

    return (
        <div className="mb-8">
            <h2 className="text-[10px] font-black uppercase text-accent-primary tracking-widest mb-3 flex items-center gap-2">
                <Mail size={14} /> Invitaciones Pendientes
            </h2>
            <div className="grid gap-3">
                <AnimatePresence>
                    {invitations.map((inv, i) => (
                        <motion.div
                            key={inv.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-bg-card border-2 border-accent-primary p-4 shadow-[8px_8px_0px_0px_var(--accent-primary)]"
                        >
                            <div className="flex gap-4">
                                <div className="h-12 w-12 bg-black border-2 border-black flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {inv.team.logo ? (
                                        <img src={inv.team.logo} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-accent-primary font-black opacity-50">TM</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-sm uppercase tracking-tight text-text-primary italic truncate">
                                        {inv.team.name}
                                    </h3>
                                    <p className="text-[10px] text-text-secondary uppercase">
                                        Rol Ofertado: <strong className="text-accent-primary">{inv.teamRole}</strong>
                                    </p>
                                    {inv.message && (
                                        <p className="text-xs text-text-secondary mt-1 italic border-l-2 border-border-subtle pl-2">
                                            "{inv.message}"
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t-2 border-border-subtle">
                                <button
                                    onClick={() => handleAction(inv.id, 'accept')}
                                    className="flex-1 bg-accent-primary text-black font-black uppercase tracking-widest text-[10px] py-2 flex items-center justify-center gap-1 border border-black hover:bg-black hover:text-white transition-all transform -skew-x-6"
                                >
                                    <Check size={14} /> Aceptar
                                </button>
                                <button
                                    onClick={() => handleAction(inv.id, 'reject')}
                                    className="px-4 bg-bg-secondary text-text-secondary font-black uppercase tracking-widest text-[10px] py-2 flex items-center justify-center gap-1 border border-black hover:bg-red-600 hover:text-white transition-all transform -skew-x-6"
                                >
                                    <X size={14} /> Rechazar
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
