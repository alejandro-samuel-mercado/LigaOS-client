'use client';

import { Shield, Trophy } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Match {
  id: string;
  homeTeam: { id: string; name: string; logo: string | null; stadium?: string | null } | null;
  awayTeam: { id: string; name: string; logo: string | null } | null;
  homeGoals: number;
  awayGoals: number;
  status: string;
  round: string;
  bracketPosition: number;
  matchDate?: string;
  stadium?: string | null;
  groupName?: string | null;
  hasExtraTime?: boolean;
  hasPenalties?: boolean;
  homePenalties?: number | null;
  awayPenalties?: number | null;
  actualStartTime?: string | null;
  secondHalfStartTime?: string | null;
  updatedAt: string;
  injuryTime1?: number | null;
  injuryTime2?: number | null;
}

interface TournamentBracketProps {
  matches: Match[];
}

const MiniMatchCard = ({ match, side }: { match: Match | null; side: 'left' | 'right' }) => {
  const [timerDisplay, setTimerDisplay] = useState('00:00');
  const [periodLabel, setPeriodLabel] = useState('');

  useEffect(() => {
    if (!match) return;
    const interval = setInterval(() => {
      let displayMin = 0;
      let displaySec = 0;
      let label = '';

      if (match.status === 'LIVE') {
        const startTime = match.secondHalfStartTime || match.actualStartTime;
        if (startTime) {
          const diffMs = Date.now() - new Date(startTime).getTime();
          const totalSec = Math.floor(diffMs / 1000);
          const baseMin = match.secondHalfStartTime ? 45 : 0;
          displayMin = baseMin + Math.floor(totalSec / 60);
          displaySec = totalSec % 60;
          label = match.secondHalfStartTime ? '2T' : '1T';
          if (displayMin > 45 && !match.secondHalfStartTime) label = '1T+';
          if (displayMin > 90) label = '2T+';
          if (match.hasExtraTime && displayMin > 90) label = 'ALAG';
          if (match.hasPenalties) label = 'PEN';
        }
      } else if (match.status === 'HALFTIME') {
        const startTime = new Date(match.updatedAt).getTime();
        const diffMs = Date.now() - startTime;
        const totalSec = Math.floor(diffMs / 1000);
        displayMin = Math.floor(totalSec / 60);
        displaySec = totalSec % 60;
        label = 'HT';
      } else if (match.status === 'FINISHED') {
        label = 'FIN';
      }

      setTimerDisplay(`${displayMin.toString().padStart(2, '0')}:${displaySec.toString().padStart(2, '0')}`);
      setPeriodLabel(label);
    }, 1000);

    return () => clearInterval(interval);
  }, [match]);

  if (!match) {
    return (
      <div className="w-48 bg-[#2A2A2A] border-2 border-black shadow-lg relative z-10 flex flex-col justify-center">
        <div className="flex items-center gap-2 p-1 px-2 h-7">
          <span className={`text-[9px] uppercase font-black tracking-tighter truncate w-full text-white/30 ${side === 'left' ? 'text-right' : 'text-left'}`}>
            A CONFIRMAR
          </span>
        </div>
        <div className="w-full h-[2px] bg-black" />
        <div className="flex items-center gap-2 p-1 px-2 h-7">
          <span className={`text-[9px] uppercase font-black tracking-tighter truncate w-full text-white/30 ${side === 'left' ? 'text-right' : 'text-left'}`}>
            A CONFIRMAR
          </span>
        </div>
      </div>
    );
  }

  const isFinished = match.status === 'FINISHED';

  const TeamRow = ({ team, goals, penalties, isWinner, hasPenalties }: { team: any, goals: number, penalties?: number | null, isWinner: boolean, hasPenalties?: boolean }) => {
    return (
      <div className={`flex items-center gap-2 p-1 px-2 h-7 ${isWinner ? 'bg-accent-primary/20' : ''}`}>
        {side === 'left' ? (
          <>
            <span className={`text-[9px] uppercase font-black tracking-tighter truncate w-full flex-1 ${!team ? 'text-white/30' : 'text-white'}`}>
              {team ? team.name : 'A CONFIRMAR'}
            </span>
            <div className="w-4 h-4 ml-auto flex items-center justify-center shrink-0 bg-white/10 border border-white/5">
              {team?.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : null}
            </div>
            {isFinished && (
              <div className="flex items-center gap-1">
                {hasPenalties && <span className="text-[8px] font-black text-accent-primary italic">({penalties ?? 0})</span>}
                <span className="text-[10px] font-black w-3 text-center text-white">{goals}</span>
              </div>
            )}
          </>
        ) : (
          <>
            {isFinished && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black w-3 text-center text-white">{goals}</span>
                {hasPenalties && <span className="text-[8px] font-black text-accent-primary italic">({penalties ?? 0})</span>}
              </div>
            )}
            <div className="w-4 h-4 mr-auto flex items-center justify-center shrink-0 bg-white/10 border border-white/5">
              {team?.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : null}
            </div>
            <span className={`text-[9px] uppercase font-black tracking-tighter text-right truncate w-full flex-1 ${!team ? 'text-white/30' : 'text-white'}`}>
              {team ? team.name : 'A CONFIRMAR'}
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <Link href={`/matches/${match.id}`} className="block relative group">
      <div className={`w-48 bg-[#2A2A2A] border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_var(--accent-primary)] hover:border-accent-primary transition-all relative z-10 flex flex-col justify-center cursor-pointer overflow-hidden ${match.status === 'LIVE' ? 'border-accent-primary' : 'border-black'}`}>
        <div className="flex items-center justify-between px-2 py-0.5 bg-black/40 border-b border-white/5">
          <span className="text-[7px] font-black text-white/40 uppercase tracking-widest truncate">
            {match.groupName ? `Grupo ${match.groupName}` : 'Partido'}
          </span>
          {match.status === 'LIVE' && (
            <div className="flex items-center gap-1">
              <span className="text-[7px] font-black text-red-500 animate-pulse uppercase">{periodLabel}</span>
              <span className="text-[7px] font-black text-accent-primary tabular-nums">{timerDisplay}</span>
            </div>
          )}
        </div>
        <TeamRow 
            team={match.homeTeam} 
            goals={match.homeGoals} 
            penalties={match.homePenalties} 
            hasPenalties={!!match.hasPenalties}
            isWinner={isFinished && (match.homeGoals > match.awayGoals || (!!match.hasPenalties && (match.homePenalties ?? 0) > (match.awayPenalties ?? 0)))} 
        />
        <div className="w-full h-[2px] bg-black" />
        <TeamRow 
            team={match.awayTeam} 
            goals={match.awayGoals} 
            penalties={match.awayPenalties} 
            hasPenalties={!!match.hasPenalties}
            isWinner={isFinished && (match.awayGoals > match.homeGoals || (!!match.hasPenalties && (match.awayPenalties ?? 0) > (match.homePenalties ?? 0)))} 
        />
        <div className="bg-black/40 px-2 py-1 border-t border-black flex items-center gap-1 justify-center">
          <span className="text-[7px] font-black text-white/40 uppercase truncate">
            {match.stadium || match.homeTeam?.stadium || 'Sede a definir'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export function TournamentBracket({ matches }: TournamentBracketProps) {
  const getMatchesByRound = (round: string) => {
    return matches
      .filter((m) => m.round === round)
      .sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0));
  };

  const r32 = getMatchesByRound('ROUND_OF_32');
  const r16 = getMatchesByRound('ROUND_OF_16');
  const qf = getMatchesByRound('QUARTER_FINAL');
  const sf = getMatchesByRound('SEMI_FINAL');
  const finals = getMatchesByRound('FINAL');

  const finalMatch = finals.length > 0 ? finals[0] : null;

  // Split matches in half for left and right
  const leftR32 = r32.slice(0, 8);
  const rightR32 = r32.slice(8, 16);

  const leftR16 = r16.slice(0, 4);
  const rightR16 = r16.slice(4, 8);
  
  const leftQF = qf.slice(0, 2);
  const rightQF = qf.slice(2, 4);
  
  const leftSF = sf.slice(0, 1);
  const rightSF = sf.slice(1, 2);

  const hasR32 = r32.length > 0;
  const hasR16 = r16.length > 0;
  const hasQF = qf.length > 0;

  // Use fixed arrays to map over, filling with null if bracket is missing teams
  const padMatches = (arr: Match[], length: number) => {
    const padded = [...arr];
    while (padded.length < length) padded.push(null as any);
    return padded;
  };

  return (
    <div className="bg-[#1a1a1a] w-full overflow-x-auto py-12 px-8 min-h-[600px] border-y-4 border-black mesh-bg flex items-center">
      
      {/* Title / Header of diagram */}
      <div className="absolute top-8 left-0 right-0 text-center pointer-events-none z-0 opacity-20">
        <h2 className="text-[6vw] font-black uppercase text-white leading-none tracking-tighter">Fase Final</h2>
      </div>

      <div className="flex justify-center items-stretch w-full min-w-max gap-8 relative z-10">
        {/* ================= LEFT SIDE ================= */}
        <div className="flex gap-12 relative items-center">
          
          {/* R32 Left Column */}
          {hasR32 && (
            <div className="flex flex-col justify-around h-[800px] w-48 relative z-10">
              {padMatches(leftR32, 8).map((m, i) => (
                <div key={m?.id || `l-r32-${i}`} className="relative">
                  <MiniMatchCard match={m} side="left" />
                  {/* Connector sending right */}
                  <div className="absolute top-1/2 -right-6 w-6 h-[2px] bg-[#00ff41] z-0" />
                </div>
              ))}
            </div>
          )}

          {/* R16 Left Column */}
          {hasR16 && (
            <div className="flex flex-col justify-around h-[800px] w-48 relative z-10">
              {padMatches(leftR16, 4).map((m, i) => (
                <div key={m?.id || `l-r16-${i}`} className="relative">
                  <MiniMatchCard match={m} side="left" />
                  {/* Connector sending right */}
                  <div className="absolute top-1/2 -right-6 w-6 h-[2px] bg-[#00ff41] z-0" />
                  {/* Vertical Connector capturing children */}
                  {hasR32 && (
                    <div className="absolute top-[-50%] bottom-[-50%] -left-6 w-6 border-l-[2px] border-y-[2px] border-[#00ff41] z-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* QF Left Column */}
          {hasQF && (
            <div className="flex flex-col justify-around h-[800px] w-48 relative z-10">
              {padMatches(leftQF, 2).map((m, i) => (
                <div key={m?.id || `l-qf-${i}`} className="relative">
                  <MiniMatchCard match={m} side="left" />
                  {/* Connector sending right */}
                  <div className="absolute top-1/2 -right-6 w-6 h-[2px] bg-[#00ff41] z-0" />
                  {/* Vertical Connector capturing children */}
                  {hasR16 && (
                    <div className="absolute top-[-50%] bottom-[-50%] -left-6 w-6 border-l-[2px] border-y-[2px] border-[#00ff41] z-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* SF Left Column */}
          <div className="flex flex-col justify-around h-[800px] w-48 relative z-10">
             {padMatches(leftSF, 1).map((m, i) => (
                <div key={m?.id || `l-sf-${i}`} className="relative">
                  <MiniMatchCard match={m} side="left" />
                  {/* Connector sending right to final */}
                  <div className="absolute top-1/2 -right-8 w-8 h-[2px] bg-[#00ff41] z-0" />
                  {/* Vertical Connector capturing children */}
                  {hasQF && (
                    <div className="absolute top-[-100%] bottom-[-100%] -left-6 w-6 border-l-[2px] border-y-[2px] border-[#00ff41] z-0" />
                  )}
                </div>
              ))}
          </div>


        </div>

        {/* ================= CENTER ================= */}
        <div className="flex flex-col items-center justify-center w-64 mx-4 gap-8 relative z-20">
          <div className="flex flex-col items-center gap-2">
            <Trophy size={80} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" strokeWidth={1} />
            {finalMatch?.matchDate && (
              <div className="bg-[#111] border border-[#00ff41] px-4 py-1 text-[#00ff41] text-[10px] font-black uppercase tracking-widest mt-4">
                {new Date(finalMatch.matchDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
              </div>
            )}
          </div>
          
          <div className="relative">
             {/* Converging points */}
             <div className="absolute top-1/2 left-[-32px] w-[32px] h-[2px] bg-[#00ff41] z-0" />
             <div className="absolute top-1/2 right-[-32px] w-[32px] h-[2px] bg-[#00ff41] z-0" />
             
             <div className="w-56 bg-[#2A2A2A] border-4 border-[#00ff41] shadow-[0_0_20px_rgba(0,255,65,0.2)] relative z-10 flex flex-col justify-center cursor-pointer">
              {finalMatch ? (
                <Link href={`/matches/${finalMatch.id}`}>
                  <div className={`flex justify-between items-center p-2 border-b-2 border-black ${finalMatch.status === 'FINISHED' && (finalMatch.homeGoals > finalMatch.awayGoals || (finalMatch.hasPenalties && (finalMatch.homePenalties ?? 0) > (finalMatch.awayPenalties ?? 0))) ? 'bg-accent-primary/20' : ''}`}>
                    <span className="text-xs font-black uppercase tracking-tight text-white">{finalMatch.homeTeam?.name || 'TBD'}</span>
                    {finalMatch.status === 'FINISHED' && (
                        <div className="flex items-center gap-2">
                            {finalMatch.hasPenalties && <span className="text-[10px] font-black text-accent-primary italic">({finalMatch.homePenalties ?? 0})</span>}
                            <span className="text-sm font-black text-white">{finalMatch.homeGoals}</span>
                        </div>
                    )}
                  </div>
                  <div className={`flex justify-between items-center p-2 ${finalMatch.status === 'FINISHED' && (finalMatch.awayGoals > finalMatch.homeGoals || (finalMatch.hasPenalties && (finalMatch.awayPenalties ?? 0) > (finalMatch.homePenalties ?? 0))) ? 'bg-accent-primary/20' : ''}`}>
                    <span className="text-xs font-black uppercase tracking-tight text-white">{finalMatch.awayTeam?.name || 'TBD'}</span>
                    {finalMatch.status === 'FINISHED' && (
                        <div className="flex items-center gap-2">
                             {finalMatch.hasPenalties && <span className="text-[10px] font-black text-accent-primary italic">({finalMatch.awayPenalties ?? 0})</span>}
                            <span className="text-sm font-black text-white">{finalMatch.awayGoals}</span>
                        </div>
                    )}
                  </div>
                </Link>
              ) : (
                <>
                  <div className="p-2 border-b-2 border-black text-center text-[10px] font-black uppercase text-white/30">A Confirmar</div>
                  <div className="p-2 text-center text-[10px] font-black uppercase text-white/30">A Confirmar</div>
                </>
              )}
             </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}
        {/* Note: Columns are reversed using standard flex ordering, right hand side goes SF -> QF -> R16 from left to right */}
        <div className="flex gap-12 relative items-center">
          
          {/* SF Right Column */}
          <div className="flex flex-col justify-around h-[800px] w-48 relative z-10">
             {padMatches(rightSF, 1).map((m, i) => (
                <div key={m?.id || `r-sf-${i}`} className="relative">
                  <MiniMatchCard match={m} side="right" />
                  {/* Vertical Connector capturing children */}
                  {hasQF && (
                    <div className="absolute top-[-100%] bottom-[-100%] -right-6 w-6 border-r-[2px] border-y-[2px] border-[#00ff41] z-0" />
                  )}
                </div>
              ))}
          </div>

          {/* QF Right Column */}
          {hasQF && (
            <div className="flex flex-col justify-around h-[800px] w-48 relative z-10">
              {padMatches(rightQF, 2).map((m, i) => (
                <div key={m?.id || `r-qf-${i}`} className="relative">
                  <MiniMatchCard match={m} side="right" />
                  {/* Connector sending left */}
                  <div className="absolute top-1/2 -left-6 w-6 h-[2px] bg-[#00ff41] z-0" />
                   {/* Vertical Connector capturing children */}
                   {hasR16 && (
                    <div className="absolute top-[-50%] bottom-[-50%] -right-6 w-6 border-r-[2px] border-y-[2px] border-[#00ff41] z-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* R16 Right Column */}
          {hasR16 && (
            <div className="flex flex-col justify-around h-[800px] w-48 relative z-10">
              {padMatches(rightR16, 4).map((m, i) => (
                <div key={m?.id || `r-r16-${i}`} className="relative">
                  <MiniMatchCard match={m} side="right" />
                  {/* Connector sending left */}
                  <div className="absolute top-1/2 -left-6 w-6 h-[2px] bg-[#00ff41] z-0" />
                  {/* Vertical Connector capturing children */}
                  {hasR32 && (
                    <div className="absolute top-[-50%] bottom-[-50%] -right-6 w-6 border-r-[2px] border-y-[2px] border-[#00ff41] z-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* R32 Right Column */}
          {hasR32 && (
            <div className="flex flex-col justify-around h-[800px] w-48 relative z-10">
              {padMatches(rightR32, 8).map((m, i) => (
                <div key={m?.id || `r-r32-${i}`} className="relative">
                  <MiniMatchCard match={m} side="right" />
                  {/* Connector sending left */}
                  <div className="absolute top-1/2 -left-6 w-6 h-[2px] bg-[#00ff41] z-0" />
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
