'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Plus, Search } from 'lucide-react';
import { api } from '@/adapters/http';
import { LABELS } from '@/content/labels';
import { ROLE_LABELS } from '@/content/roles';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';
import { useRouter } from 'next/navigation';

interface UserPreview {
  id: string;
  name: string;
  lastName: string;
  email: string;
  role: string;
  image: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserPreview[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();
  const { info } = useAlert();
  const router = useRouter();

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    async function fetchUsers() {
      if (!isAdmin) return;
      setLoading(true);
      try {
        const { data } = await api.get(`/search?query=${search}&type=users`);
        setUsers(data.data.users || []);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [search, isAdmin]);

  if (authLoading || !isAdmin) return null;

  return (
    <div className="main-container px-6 py-12 space-y-8 bg-bg-primary mesh-bg min-h-screen">
      <div className="flex items-end justify-between border-b-8 border-black pb-4">
        <h1 className="text-5xl font-black text-text-primary tracking-tighter uppercase leading-none italic">Usuarios</h1>
        <div className="h-4 w-24 bg-accent-primary" />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar usuario..."
          className="w-full border-2 border-black bg-bg-secondary py-3 pl-12 pr-4 text-sm font-bold text-text-primary placeholder-text-secondary/40 outline-none focus:border-accent-primary transition-all"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="py-20 text-center border-4 border-dashed border-black/10">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">No se encontraron usuarios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {users.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/players/${u.id}`}
                className="group flex items-center gap-4 bg-bg-card border-2 border-black p-5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center bg-black text-white text-sm font-black shrink-0 border-2 border-black overflow-hidden">
                  {u.image ? (
                    <img src={u.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    `${u.name[0]}${u.lastName[0]}`
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-text-primary uppercase italic truncate group-hover:text-accent-primary transition-colors">{u.name} {u.lastName}</h3>
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest truncate">{ROLE_LABELS[u.role] ?? u.role} · {u.email}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* FAB for creation */}
      <button
        className="fixed bottom-24 right-4 flex h-14 w-14 items-center justify-center bg-accent-primary text-white shadow-lg border-2 border-black z-50 hover:scale-105 active:scale-95 transition-transform"
        onClick={() => info('Abrir modal de crear usuario')}
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
