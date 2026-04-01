/**
 * Match status constants and WebSocket event names.
 * Single source of truth for match-related enumerations.
 */

export const MATCH_STATUSES = {
  UPCOMING: 'UPCOMING',
  LIVE: 'LIVE',
  HALFTIME: 'HALFTIME',
  FINISHED: 'FINISHED',
  SUSPENDED: 'SUSPENDED',
} as const;

/**
 * Socket.io event names for real-time match tracking.
 * Used by both server (emit) and client (listen).
 */
export const SOCKET_EVENTS = {
  MATCH_JOIN: 'match:join',
  MATCH_LEAVE: 'match:leave',
  MATCH_EVENT: 'match:event',
  MATCH_STATUS_CHANGE: 'match:status_change',
  MATCH_SCORE_UPDATE: 'match:score_update',
  MATCH_LINEUP_UPDATE: 'match:lineup_update',
} as const;
