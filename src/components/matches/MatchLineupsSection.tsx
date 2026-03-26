'use client';

import { usePersistentData } from '@/hooks/usePersistentData';
import { api } from '@/adapters/http';
import { MatchLineup } from './MatchLineup';

export function MatchLineupsSection({ match, user, onLineupSaved }: { match: any, user: any, onLineupSaved: () => void }) {
  // Fetch team players to allow coach to pick
  const { data: homePlayers } = usePersistentData<any[]>(
    `team_players_${match.homeTeam.id}`,
    async () => {
      const { data } = await api.get(`/teams/${match.homeTeam.id}`);
      return data.data.players.map((p: any) => p.player);
    },
    [match.homeTeam.id]
  );
  
  const { data: awayPlayers } = usePersistentData<any[]>(
    `team_players_${match.awayTeam.id}`,
    async () => {
      const { data } = await api.get(`/teams/${match.awayTeam.id}`);
      return data.data.players.map((p: any) => p.player);
    },
    [match.awayTeam.id]
  );

  const homeLineup = match.lineups?.filter((l: any) => l.teamId === match.homeTeam.id) || [];
  const awayLineup = match.lineups?.filter((l: any) => l.teamId === match.awayTeam.id) || [];

  const isHomeAuthorized = user && (
    user.role === 'SUPER_ADMIN' || 
    user.role === 'ADMIN' || 
    (user.role === 'COACH' && match.homeTeam.coachId === user.id) ||
    (user.role === 'PRESIDENT' && match.homeTeam.presidentId === user.id)
  );
  
  const isAwayAuthorized = user && (
    user.role === 'SUPER_ADMIN' || 
    user.role === 'ADMIN' || 
    (user.role === 'COACH' && match.awayTeam.coachId === user.id) ||
    (user.role === 'PRESIDENT' && match.awayTeam.presidentId === user.id)
  );

  return (
    <div className="bg-bg-card border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mt-8">
      <div className="p-8">
        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-text-secondary opacity-60 mb-6 text-center">
          Alineaciones
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <MatchLineup 
            matchId={match.id}
            team={match.homeTeam}
            isHome={true}
            currentLineup={homeLineup}
            teamPlayers={homePlayers || []}
            isAuthorized={!!isHomeAuthorized}
            onLineupSaved={onLineupSaved}
          />
          <MatchLineup 
            matchId={match.id}
            team={match.awayTeam}
            isHome={false}
            currentLineup={awayLineup}
            teamPlayers={awayPlayers || []}
            isAuthorized={!!isAwayAuthorized}
            onLineupSaved={onLineupSaved}
          />
        </div>
      </div>
    </div>
  );
}
