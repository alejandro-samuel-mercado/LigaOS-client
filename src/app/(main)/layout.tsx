import { BottomNav } from '@/components/layout/BottomNav';
import { WelcomeWizard } from '@/components/features/onboarding/WelcomeWizard';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-primary">
      <main className="flex-1">
        {children}
      </main>
      <BottomNav />
      <WelcomeWizard />
    </div>
  );
}
