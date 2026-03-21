/**
 * Root layout — wraps entire application with AuthProvider and Google Fonts.
 * Sets up dark theme, viewport meta for mobile, and PWA manifest.
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AlertProvider } from '@/context/AlertContext';
import { ThemeProvider } from '@/context/ThemeContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Liga - Gestión de Liga de Fútbol',
  description: 'Sistema de gestión de ligas de fútbol de barrio. Torneos, equipos, partidos en tiempo real.',
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#050a15',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased">
        <ThemeProvider>
          <AlertProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
