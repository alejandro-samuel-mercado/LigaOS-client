import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Equipos',
  description: 'Todos los equipos registrados en la liga. Encuentra tu equipo o descubre nuevos.',
};

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
