import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel de Árbitro',
  description: 'Tus partidos asignados como árbitro. Controla el marcador y eventos en tiempo real.',
};

export default function RefereeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
