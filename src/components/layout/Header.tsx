/**
 * Dynamic header component.
 * Adapts title, background, and actions based on the current section.
 * Supports gradient backgrounds that change per section.
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { HEADER_TITLES } from '@/content/navigation';
import { Bell, Settings, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const basePath = '/' + (pathname.split('/')[1] ?? '');
  const title = HEADER_TITLES[basePath] ?? 'Liga';

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
              <button className="p-2 text-white hover:bg-black/10 transition-colors border border-transparent hover:border-white/20">
                <Bell size={22} strokeWidth={3} />
              </button>
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
