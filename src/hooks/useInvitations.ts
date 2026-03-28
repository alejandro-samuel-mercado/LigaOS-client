'use client';

import { useCallback, useEffect, useState } from 'react';
import { invitationsService } from '@/services/api';
import type { TeamInvitation, TeamRole } from '@/types';
import { useAuth } from '@/context/AuthContext';

export function useReceivedInvitations() {
  const { isAuthenticated } = useAuth();
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const result = await invitationsService.getReceived();
      setInvitations(result);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const accept = useCallback(async (id: string) => {
    await invitationsService.accept(id);
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const reject = useCallback(async (id: string) => {
    await invitationsService.reject(id);
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { invitations, isLoading, refresh, accept, reject };
}

export function useSentInvitations(teamId: string) {
  const { isAuthenticated } = useAuth();
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !teamId) return;
    setIsLoading(true);
    try {
      const result = await invitationsService.getSent(teamId);
      setInvitations(result);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, teamId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cancel = useCallback(async (id: string) => {
    await invitationsService.cancel(id);
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const sendInvitation = useCallback(async (payload: {
    invitedUserId?: string;
    invitedEmail?: string;
    invitedDni?: string;
    teamRole?: TeamRole;
    message?: string;
  }) => {
    const invitation = await invitationsService.create({
      teamId,
      ...payload,
    });
    setInvitations((prev) => [invitation, ...prev]);
    return invitation;
  }, [teamId]);

  return { invitations, isLoading, refresh, cancel, sendInvitation };
}
