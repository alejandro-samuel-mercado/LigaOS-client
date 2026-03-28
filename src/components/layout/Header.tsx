'use client';

import { HEADER_TITLES } from '@/content/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Check, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const notifRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/social?query=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const basePath = '/' + (pathname.split('/')[1] ?? '');
  const title = HEADER_TITLES[basePath] ?? 'Liga';

  const recentNotifications = notifications.slice(0, 8);

  return (
    <header className="sticky top-0 z-40 bg-accent-primary border-b-4 border-black/20 shadow-2xl">
      <div className="safe-area-top" />
      <div className="main-container flex items-center justify-between px-6 py-5">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">{title}</h1>
          {isAuthenticated && user && (
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1 w-1 rounded-full bg-white/50" />
              <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">
                {user.name} {user.lastName}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex items-center">
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="overflow-hidden mr-2"
                >
                  <input
                    autoFocus
                    type="text"
                    placeholder="BUSCAR..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                    className="w-full bg-black/20 border-2 border-white/20 rounded-none px-4 py-2 text-xs font-black text-white placeholder:text-white/40 outline-none focus:border-white transition-all uppercase"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-white hover:bg-black/10 transition-colors border border-transparent hover:border-white/20"
            >
              <Search size={22} strokeWidth={3} />
            </button>
          </div>
          
          {isAuthenticated ? (
            <>
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 text-white hover:bg-black/10 transition-colors border border-transparent hover:border-white/20 relative"
                >
                  <Bell size={22} strokeWidth={3} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center border-2 border-accent-primary">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-surface-card border-2 border-border-default shadow-2xl z-50 max-h-96 overflow-y-auto"
                    >
                      <div className="flex items-center justify-between p-3 border-b border-border-default">
                        <span className="text-xs font-black uppercase text-text-primary tracking-wider">
                          Notificaciones
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => { markAllAsRead(); }}
                            className="text-[10px] font-bold text-accent-primary uppercase flex items-center gap-1"
                          >
                            <Check size={12} /> Leer todas
                          </button>
                        )}
                      </div>

                      {recentNotifications.length === 0 ? (
                        <div className="p-6 text-center text-text-secondary text-xs">
                          Sin notificaciones
                        </div>
                      ) : (
                        recentNotifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => {
                              if (!notif.isRead) markAsRead(notif.id);
                              setIsNotifOpen(false);
                            }}
                            className={`w-full text-left p-3 border-b border-border-default/50 hover:bg-surface-hover transition-colors ${!notif.isRead ? 'bg-accent-primary/5' : ''}`}
                          >
                            <p className="text-xs font-bold text-text-primary leading-tight">{notif.title}</p>
                            <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">{notif.body}</p>
                            <p className="text-[9px] text-text-muted mt-1 uppercase">
                              {new Date(notif.createdAt).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href="/profile"
                className="flex h-11 w-11 items-center justify-center bg-white text-accent-primary text-base font-black border-2 border-black/20 hover:scale-105 transition-transform"
              >
                {user?.name?.[0]}{user?.lastName?.[0]}
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-white px-6 py-2.5 text-xs font-black uppercase text-accent-primary hover:bg-black hover:text-white transition-all border-b-4 border-black/20 active:translate-y-1 active:border-b-0"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

