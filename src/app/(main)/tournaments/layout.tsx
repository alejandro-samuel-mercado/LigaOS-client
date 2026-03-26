import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Torneos',
  description: 'Torneos activos y finalizados. Tabla de posiciones, fixture y resultados.',
};

export default function TournamentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
