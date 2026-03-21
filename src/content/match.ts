/**
 * Match status labels and event type labels for display.
 */

export const MATCH_STATUS_LABELS: Record<string, string> = {
  UPCOMING: 'Próximo',
  LIVE: 'En Juego',
  HALFTIME: 'Entretiempo',
  FINISHED: 'Finalizado',
  SUSPENDED: 'Suspendido',
  POSTPONED: 'Postergado',
  ANNULLED: 'Anulado',
};

export const MATCH_EVENT_LABELS: Record<string, string> = {
  GOAL: 'Gol',
  FOUL: 'Falta',
  YELLOW_CARD: 'Tarjeta Amarilla',
  RED_CARD: 'Tarjeta Roja',
  SUBSTITUTION: 'Cambio',
  WARNING: 'Llamado de atención',
  MATCH_START: 'Inicio del partido',
  HALFTIME_START: 'Inicio de entretiempo',
  HALFTIME_END: 'Fin de entretiempo',
  MATCH_END: 'Fin del partido',
};

export const PLAYER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INJURED: 'Lesionado',
  RESTING: 'En descanso',
  INACTIVE: 'Inactivo',
};

export const MATCH_STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'bg-blue-500/20 text-blue-400',
  LIVE: 'bg-green-500/20 text-green-400',
  HALFTIME: 'bg-yellow-500/20 text-yellow-400',
  FINISHED: 'bg-gray-500/20 text-gray-400',
  SUSPENDED: 'bg-red-500/20 text-red-400',
  POSTPONED: 'bg-accent-gold/20 text-accent-gold',
  ANNULLED: 'bg-red-900/50 text-red-500',
};
