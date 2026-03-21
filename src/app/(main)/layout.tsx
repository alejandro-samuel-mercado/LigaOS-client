/**
 * Main layout — wraps authenticated pages with Header and BottomNav.
 * Provides the core mobile app structure.
 */

import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-primary">
      <main className="flex-1">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
