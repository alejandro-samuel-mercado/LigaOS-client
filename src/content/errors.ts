/**
 * Error messages mapped from backend error codes to user-facing strings.
 * All error handling in the UI should reference these mappings.
 */

export const ERROR_MESSAGES: Record<string, string> = {
  AUTH_TOKEN_MISSING: 'Debes iniciar sesión para continuar.',
  AUTH_TOKEN_INVALID: 'Tu sesión expiró. Iniciá sesión nuevamente.',
  AUTH_REQUIRED: 'Necesitás autenticarte para acceder.',
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos.',
  USER_EXISTS: 'Ya existe un usuario con ese email.',
  DNI_EXISTS: 'Ya existe un usuario con ese DNI.',
  PHONE_EXISTS: 'Ya existe un usuario con ese teléfono.',
  USER_INACTIVE: 'Tu cuenta no está activa.',
  REFRESH_TOKEN_INVALID: 'Sesión inválida. Iniciá sesión nuevamente.',
  REFRESH_TOKEN_MISSING: 'Sesión expirada.',
  INSUFFICIENT_PERMISSIONS: 'No tenés permisos para realizar esta acción.',
  VALIDATION_ERROR: 'Hay errores en los datos ingresados.',
  DUPLICATE_ENTRY: 'Ya existe un registro con esos datos.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  TEAM_NOT_FOUND: 'Equipo no encontrado.',
  TOURNAMENT_NOT_FOUND: 'Torneo no encontrado.',
  MATCH_NOT_FOUND: 'Partido no encontrado.',
  NOT_TEAM_PRESIDENT: 'Solo el presidente del equipo puede hacer esto.',
  NOT_ASSIGNED_REFEREE: 'Solo el árbitro asignado puede registrar eventos.',
  PLAYER_IN_TEAM: 'El jugador ya está activo en otro equipo.',
  REGISTRATION_CLOSED: 'Las inscripciones al torneo están cerradas.',
  ALREADY_INSCRIBED: 'El equipo ya está inscripto en este torneo.',
  SAME_TEAM: 'El equipo local y visitante no pueden ser el mismo.',
  NO_REFEREES: 'No hay árbitros disponibles.',
  RATE_LIMITED: 'Demasiadas solicitudes. Esperá un momento.',
  INTERNAL_ERROR: 'Error inesperado. Intentá de nuevo más tarde.',
};

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? 'Ocurrió un error inesperado.';
}
