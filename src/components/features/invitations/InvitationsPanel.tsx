'use client';

import { useReceivedInvitations } from '@/hooks/useInvitations';
import { useAuth } from '@/context/AuthContext';
import { Mail, Check, X } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { TeamInvitation } from '@/types';

export function InvitationsPanel() {
  const { isAuthenticated } = useAuth();
  const { invitations, accept, reject } = useReceivedInvitations();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pending = invitations.filter((i) => i.status === 'PENDING');

  if (!isAuthenticated || pending.length === 0) return null;

  const handleAccept = async (id: string) => {
    setProcessingId(id);
    try {
      await accept(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await reject(id);
    } finally {
      setProcessingId(null);
    }
  };

  const roleLabels: Record<string, string> = {
    PRESIDENT: 'Presidente',
    COACH: 'Director Técnico',
    PLAYER: 'Jugador',
    STAFF: 'Staff',
  };

  return (
    <div className="bg-surface-card border-2 border-accent-primary/30 mb-4">
      <div className="flex items-center gap-2 p-3 border-b border-border-default bg-accent-primary/5">
        <Mail size={16} className="text-accent-primary" />
        <span className="text-xs font-black uppercase text-text-primary tracking-wider">
          Invitaciones pendientes ({pending.length})
        </span>
      </div>

      <AnimatePresence>
        {pending.map((inv: TeamInvitation) => (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 border-b border-border-default/50 flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary truncate">
                {inv.team?.name ?? 'Equipo'}
              </p>
              <p className="text-[10px] text-text-secondary uppercase">
                Como {roleLabels[inv.teamRole] ?? inv.teamRole}
              </p>
              {inv.message && (
                <p className="text-[11px] text-text-muted mt-1 italic">{inv.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleAccept(inv.id)}
                disabled={processingId === inv.id}
                className="p-1.5 bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => handleReject(inv.id)}
                disabled={processingId === inv.id}
                className="p-1.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
