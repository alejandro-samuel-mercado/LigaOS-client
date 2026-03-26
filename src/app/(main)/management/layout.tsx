import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel de Gestión',
  description: 'Administra equipos, jugadores, torneos y configuración de la liga.',
};

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return children;
}
