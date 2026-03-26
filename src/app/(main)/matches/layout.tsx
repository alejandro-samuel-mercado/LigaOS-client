import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partidos',
  description: 'Todos los partidos de la liga. En vivo, próximos y resultados anteriores.',
};

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
