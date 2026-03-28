import { api } from '@/adapters/http';
import type {
  FavoriteTeam,
  Notification,
  PaginationData,
  TeamInvitation,
  TopScorer,
  TeamStreak,
  HeadToHead,
  RefereePreview,
  TeamRole,
} from '@/types';

export const favoritesService = {
  async addFavorite(teamId: string): Promise<FavoriteTeam> {
    const { data } = await api.post(`/favorites/teams/${teamId}`);
    return data.data;
  },

  async removeFavorite(teamId: string): Promise<void> {
    await api.delete(`/favorites/teams/${teamId}`);
  },

  async getMyFavorites(): Promise<FavoriteTeam[]> {
    const { data } = await api.get('/favorites/teams');
    return data.data;
  },

  async checkFavorite(teamId: string): Promise<boolean> {
    const { data } = await api.get(`/favorites/teams/${teamId}/check`);
    return data.data.isFavorite;
  },
};

export const invitationsService = {
  async create(payload: {
    teamId: string;
    invitedUserId?: string;
    invitedEmail?: string;
    invitedDni?: string;
    teamRole?: TeamRole;
    message?: string;
  }): Promise<TeamInvitation> {
    const { data } = await api.post('/invitations', payload);
    return data.data;
  },

  async getReceived(status?: string): Promise<TeamInvitation[]> {
    const { data } = await api.get('/invitations/received', {
      params: status ? { status } : {},
    });
    return data.data;
  },

  async getSent(teamId: string): Promise<TeamInvitation[]> {
    const { data } = await api.get(`/invitations/sent/${teamId}`);
    return data.data;
  },

  async accept(invitationId: string): Promise<void> {
    await api.patch(`/invitations/${invitationId}/accept`);
  },

  async reject(invitationId: string): Promise<void> {
    await api.patch(`/invitations/${invitationId}/reject`);
  },

  async cancel(invitationId: string): Promise<void> {
    await api.delete(`/invitations/${invitationId}`);
  },
};

export const notificationsService = {
  async getNotifications(params?: {
    page?: number;
    pageSize?: number;
    unreadOnly?: boolean;
  }): Promise<{ data: Notification[]; pagination: PaginationData }> {
    const { data } = await api.get('/notifications', {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        ...(params?.unreadOnly ? { unreadOnly: 'true' } : {}),
      },
    });
    return { data: data.data, pagination: data.pagination };
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get('/notifications/unread-count');
    return data.data.count;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async subscribePush(subscription: PushSubscription): Promise<void> {
    const json = subscription.toJSON();
    await api.post('/notifications/subscribe', {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
    });
  },

  async unsubscribePush(endpoint: string): Promise<void> {
    await api.post('/notifications/unsubscribe', { endpoint });
  },
};

export const statsService = {
  async getTopScorers(tournamentId: string): Promise<TopScorer[]> {
    const { data } = await api.get(`/stats/tournaments/${tournamentId}/scorers`);
    return data.data;
  },

  async getFairPlay(tournamentId: string): Promise<any[]> {
    const { data } = await api.get(`/stats/tournaments/${tournamentId}/fair-play`);
    return data.data;
  },

  async getTeamStreak(teamId: string, limit?: number): Promise<TeamStreak> {
    const { data } = await api.get(`/stats/teams/${teamId}/streak`, {
      params: limit ? { limit } : {},
    });
    return data.data;
  },

  async getHeadToHead(teamA: string, teamB: string): Promise<HeadToHead> {
    const { data } = await api.get('/stats/head-to-head', {
      params: { teamA, teamB },
    });
    return data.data;
  },

  async getMVP(tournamentId: string): Promise<any[]> {
    const { data } = await api.get(`/stats/tournaments/${tournamentId}/mvp`);
    return data.data;
  },
};

export const refereesService = {
  async setAvailability(slots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable?: boolean;
  }>): Promise<void> {
    await api.post('/referees/availability', { slots });
  },

  async getAvailability(refereeId: string): Promise<any[]> {
    const { data } = await api.get(`/referees/availability/${refereeId}`);
    return data.data;
  },

  async findAvailable(date: string, time: string): Promise<RefereePreview[]> {
    const { data } = await api.get('/referees/available', {
      params: { date, time },
    });
    return data.data;
  },

  async listAll(): Promise<RefereePreview[]> {
    const { data } = await api.get('/referees');
    return data.data;
  },
};

export const teamsService = {
  async transferPresidency(teamId: string, newPresidentId: string): Promise<void> {
    await api.post(`/teams/${teamId}/transfer-presidency`, { newPresidentId });
  },
};

export const matchesService = {
  async correctEvent(matchId: string, eventId: string, payload: {
    type?: string;
    playerId?: string;
    teamSide?: 'home' | 'away';
    details?: string;
    minute?: number;
  }): Promise<any> {
    const { data } = await api.patch(`/matches/${matchId}/events/${eventId}`, payload);
    return data.data;
  },

  async deleteEvent(matchId: string, eventId: string): Promise<void> {
    await api.delete(`/matches/${matchId}/events/${eventId}`);
  },
};

export const tournamentsService = {
  async finalize(tournamentId: string): Promise<{ winnerId: string; winnerName: string }> {
    const { data } = await api.post(`/tournaments/${tournamentId}/finalize`);
    return data.data;
  },
};
