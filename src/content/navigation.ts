/**
 * Navigation labels used in the bottom navigation bar and header.
 */

export const NAVIGATION = {
  home: 'Inicio',
  tournaments: 'Torneos',
  social: 'Publicaciones',
  myTeam: 'Mi Equipo',
  profile: 'Perfil',
} as const;

export const HEADER_TITLES: Record<string, string> = {
  '/': 'Liga',
  '/tournaments': 'Torneos',
  '/social': 'Publicaciones',
  '/my-team': 'Mi Equipo',
  '/management': 'Gestión',
  '/profile': 'Mi Perfil',
  '/referee': 'Mis Partidos',
};
