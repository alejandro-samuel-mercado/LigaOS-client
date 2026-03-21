/**
 * General messages for toasts, confirmations, and notifications.
 */

export const MESSAGES = {
  auth: {
    loginSuccess: '¡Bienvenido de vuelta!',
    registerSuccess: '¡Cuenta creada exitosamente!',
    logoutSuccess: 'Sesión cerrada.',
  },
  team: {
    created: 'Equipo creado exitosamente.',
    updated: 'Equipo actualizado.',
    playerAdded: 'Jugador agregado al equipo.',
    playerRemoved: 'Jugador removido del equipo.',
    deactivated: 'Equipo desactivado.',
  },
  match: {
    eventRegistered: 'Evento registrado.',
    goalScored: '¡GOOOL!',
    matchStarted: 'El partido ha comenzado.',
    halftime: 'Entretiempo.',
    matchEnded: 'Partido finalizado.',
  },
  tournament: {
    created: 'Torneo creado exitosamente.',
    inscriptionSent: 'Inscripción enviada. Esperando aprobación.',
    inscriptionAccepted: 'Inscripción aprobada.',
    inscriptionRejected: 'Inscripción rechazada.',
  },
  publication: {
    created: 'Publicación creada.',
    commentAdded: 'Comentario agregado.',
  },
  referee: {
    assigned: 'Árbitro asignado. Esperando confirmación.',
    confirmed: 'Árbitro confirmado para el partido.',
    rejected: 'Asignación de árbitro rechazada.',
  },
} as const;
