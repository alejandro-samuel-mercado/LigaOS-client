import { OnboardingModal } from '@/components/features/onboarding/OnboardingModal';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AlertProvider } from '@/context/AlertContext';
import { AuthProvider } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import { SocketProvider } from '@/context/SocketContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ThemeProvider } from '@/context/ThemeContext';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { PushNotificationManager } from '@/components/features/notifications/PushNotificationManager';
import { PageTransition } from '@/components/ui/PageTransition';
import { ProductTour } from '@/components/features/onboarding/ProductTour';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'LigaPRO - Gestión de Liga de Fútbol',
    template: '%s | LigaPRO',
  },
  description: 'Sistema de gestión de ligas de fútbol de barrio. Torneos, equipos, partidos en tiempo real.',
  manifest: '/manifest.json',
  icons: { icon: '/icon.png' },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'LigaPRO',
    title: 'LigaPRO - Gestión de Liga de Fútbol',
    description: 'Sistema de gestión de ligas de fútbol de barrio. Torneos, equipos, partidos en tiempo real.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ccff00',
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
              <LocationProvider>
                <SocketProvider>
                  <NotificationProvider>
                  <ErrorBoundary>
                    <PageTransition>
                      {children}
                    </PageTransition>
                    <PushNotificationManager />
                    <OnboardingModal />
                    <ProductTour />
                  </ErrorBoundary>
                  </NotificationProvider>
                </SocketProvider>
              </LocationProvider>
            </AuthProvider>
          </AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
