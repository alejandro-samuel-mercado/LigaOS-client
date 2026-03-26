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
