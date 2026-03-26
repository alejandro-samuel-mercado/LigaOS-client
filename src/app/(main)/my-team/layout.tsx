import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Equipo',
  description: 'Gestiona tu equipo, jugadores e inscripciones a torneos.',
};

export default function MyTeamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
