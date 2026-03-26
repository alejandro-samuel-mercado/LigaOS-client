import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Perfil',
  description: 'Gestiona tu perfil, privacidad y configuración de cuenta.',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
