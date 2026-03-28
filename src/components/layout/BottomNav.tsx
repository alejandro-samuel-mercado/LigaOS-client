'use client';

import { NAVIGATION } from '@/content/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';
import { Home, MessageSquare, Moon, Shield, Sun, Trophy, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationBell } from '../features/notifications/NotificationBell';

export function BottomNav() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();

    const NAV_ITEMS = [
        { href: '/', icon: Home, label: NAVIGATION.home },
        { href: '/tournaments', icon: Trophy, label: NAVIGATION.tournaments },
        { href: '/social', icon: MessageSquare, label: NAVIGATION.social },
        user?.role === 'REFEREE'
            ? { href: '/referee', icon: Shield, label: 'Mis Partidos' }
            : { href: '/my-team', icon: Shield, label: NAVIGATION.myTeam },
        { href: '/profile', icon: User, label: NAVIGATION.profile },
    ];

    return (
        <>
            <button
                onClick={toggleTheme}
                className={`absolute top-6 right-6 z-50 h-12 w-12 rounded-full bg-accent-primary  backdrop-blur-xl border border-white/20 flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all`}
            >
                {theme === 'light' ? <Moon size={20} className="text-slate-200" /> : <Sun size={20} className="text-amber-400" />}
            </button>

            <NotificationBell />

            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-bg-secondary/90 backdrop-blur-2xl safe-area-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
                <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative flex flex-col items-center gap-1 px-3 py-1 scale-100 active:scale-90 transition-transform"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute -top-1.5 h-1 w-6 rounded-full bg-accent-primary"
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <Icon
                                    size={24}
                                    className={`transition-all duration-300 ${isActive ? 'text-accent-primary scale-110' : 'text-text-secondary opacity-60'
                                        }`}
                                />
                                <span
                                    className={`text-[9px] font-black uppercase tracking-tighter transition-all duration-300 ${isActive ? 'text-accent-primary opacity-100' : 'text-text-secondary opacity-40'
                                        }`}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
