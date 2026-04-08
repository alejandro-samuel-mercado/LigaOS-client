'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Users, Shield, Loader2 } from 'lucide-react';
import { api } from '@/adapters/http';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function SocialNetworkPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'following_teams' | 'following_users' | 'followers'>('following_teams');
  
  const [teams, setTeams] = useState<any[]>([]);
  const [followingUsers, setFollowingUsers] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [teamsRes, followingRes, followersRes] = await Promise.all([
          api.get('/favorites'),
          api.get(`/users/${user.id}/following`),
          api.get(`/users/${user.id}/followers`)
        ]);
        
        setTeams(teamsRes.data.data.map((f: any) => f.team));
        setFollowingUsers(followingRes.data.data);
        setFollowers(followersRes.data.data);
      } catch (err) {
        console.error('Error fetching social data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, isAuthenticated, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-32 mesh-bg">
      <div className="relative h-40 bg-black border-b-8 border-accent-primary overflow-hidden flex items-end">
        <h1 className="text-4xl px-6 py-6 font-black text-white italic uppercase tracking-tighter w-full text-center md:text-left">Mi Red Social</h1>
        <button onClick={() => router.back()} className="absolute top-6 left-6 h-12 w-12 flex items-center justify-center bg-white/10 text-white border-2 border-white/20 hover:bg-white hover:text-black transition-all z-20">
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
      </div>

      <div className="main-container px-6 pt-8">
        <div className="flex border-b-4 border-black mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('following_teams')}
            className={`flex-1 py-4 px-6 text-sm font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-4 ${activeTab === 'following_teams' ? 'border-accent-primary text-text-primary bg-bg-card' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-black/5'}`}
          >
            Equipos ({teams.length})
          </button>
          <button
            onClick={() => setActiveTab('following_users')}
            className={`flex-1 py-4 px-6 text-sm font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-4 ${activeTab === 'following_users' ? 'border-accent-primary text-text-primary bg-bg-card' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-black/5'}`}
          >
            Jugadores Seguidos ({followingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-4 px-6 text-sm font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-4 ${activeTab === 'followers' ? 'border-accent-primary text-text-primary bg-bg-card' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-black/5'}`}
          >
            Mis Seguidores ({followers.length})
          </button>
        </div>

        <div className="space-y-4">
          {activeTab === 'following_teams' && (
            <AnimatePresence>
              {teams.length === 0 ? (
                <div className="py-20 text-center border-4 border-dashed border-black/10">
                  <p className="text-sm font-black uppercase tracking-widest opacity-30 italic">No sigues ningún equipo.</p>
                </div>
              ) : (
                teams.map((t) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    onClick={() => router.push(`/teams/${t.id}`)}
                    className="flex w-full cursor-pointer items-center justify-between p-4 bg-bg-card border-2 border-black hover:bg-accent-primary hover:text-black transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 bg-black border-2 border-black flex items-center justify-center overflow-hidden">
                        {t.logo ? <img src={t.logo} alt="" className="object-cover h-full w-full" /> : <Shield size={24} className="text-white/20" />}
                      </div>
                      <div className="text-left space-y-1">
                        <span className="block font-black uppercase text-xl italic tracking-tighter">{t.name}</span>
                        <span className="text-[10px] opacity-60 uppercase font-black tracking-widest block">{t.city} • {t.category}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          )}

          {activeTab === 'following_users' && (
            <AnimatePresence>
              {followingUsers.length === 0 ? (
                <div className="py-20 text-center border-4 border-dashed border-black/10">
                  <p className="text-sm font-black uppercase tracking-widest opacity-30 italic">No sigues ningún jugador o usuario.</p>
                </div>
              ) : (
                followingUsers.map((u) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    onClick={() => router.push(`/players/${u.id}`)}
                    className="flex w-full cursor-pointer items-center justify-between p-4 bg-bg-card border-2 border-black hover:bg-accent-primary hover:text-black transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 min-w-16 min-h-16 bg-black border-2 border-black flex items-center justify-center overflow-hidden">
                        {u.image ? <img src={u.image} alt="" className="object-cover h-full w-full grayscale" /> : <Users size={24} className="text-white/20" />}
                      </div>
                      <div className="text-left space-y-1">
                        <span className="block font-black uppercase text-xl italic tracking-tighter leading-none">{u.name} {u.lastName}</span>
                        <span className="text-[10px] opacity-60 uppercase font-black tracking-widest block">{u.role}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          )}

          {activeTab === 'followers' && (
            <AnimatePresence>
              {followers.length === 0 ? (
                <div className="py-20 text-center border-4 border-dashed border-black/10">
                  <p className="text-sm font-black uppercase tracking-widest opacity-30 italic">Aún no tienes seguidores.</p>
                </div>
              ) : (
                followers.map((u) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    onClick={() => router.push(`/players/${u.id}`)}
                    className="flex w-full cursor-pointer items-center justify-between p-4 bg-bg-card border-2 border-black hover:bg-accent-primary hover:text-black transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 min-w-16 min-h-16 bg-black border-2 border-black flex items-center justify-center overflow-hidden">
                        {u.image ? <img src={u.image} alt="" className="object-cover h-full w-full grayscale" /> : <Users size={24} className="text-white/20" />}
                      </div>
                      <div className="text-left space-y-1">
                        <span className="block font-black uppercase text-xl italic tracking-tighter leading-none">{u.name} {u.lastName}</span>
                        <span className="text-[10px] opacity-60 uppercase font-black tracking-widest block">{u.role}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
