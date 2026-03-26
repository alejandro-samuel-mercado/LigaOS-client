import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Búsqueda y Social',
  description: 'Busca equipos, jugadores, torneos y publicaciones. Explora la comunidad de la liga.',
};

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return children;
}
