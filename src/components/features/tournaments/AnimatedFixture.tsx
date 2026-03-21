'use client';

import { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Shield } from 'lucide-react';
import Link from 'next/link';

interface Match {
    id: string;
    matchDay: number | null;
    matchDate: string;
    matchTime: string | null;
    status: string;
    homeGoals: number;
    awayGoals: number;
    homeTeam: { id: string; name: string; logo: string | null; stadium?: string | null } | null;
    awayTeam: { id: string; name: string; logo: string | null } | null;
    stadium?: string | null;
    groupName?: string | null;
    actualStartTime?: string | null;
    secondHalfStartTime?: string | null;
    injuryTime1?: number | null;
    injuryTime2?: number | null;
    hasExtraTime?: boolean;
    hasPenalties?: boolean;
    homePenalties?: number;
    awayPenalties?: number;
    updatedAt: string;
}

interface Props {
    matches: Match[];
}

const MiniMatchCard = ({ match }: { match: Match }) => {
    const [timerDisplay, setTimerDisplay] = useState('00:00');
    const [periodLabel, setPeriodLabel] = useState('');

    useEffect(() => {
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

    const isFinished = match.status === 'FINISHED';
    const isLive = match.status === 'LIVE';

    const TeamRow = ({ team, goals, isWinner }: { team: any, goals: number, isWinner: boolean }) => {
        return (
            <div className={`flex items-center gap-2 p-1 px-2 h-7 ${isWinner ? 'bg-accent-primary/20' : ''}`}>
                <span className={`text-[10px] uppercase font-black tracking-tighter truncate w-full flex-1 ${!team ? 'text-white/30' : 'text-white'}`}>
                    {team ? team.name : 'A CONFIRMAR'}
                </span>
                <div className="w-5 h-5 ml-auto flex items-center justify-center shrink-0 bg-white/10 border border-white/5">
                    {team?.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : <Shield size={10} className="text-white/50" />}
                </div>
                {(isFinished || isLive) && <span className="text-[10px] font-black w-3 text-center text-white">{goals}</span>}
            </div>
        );
    };

    // Minute calculation
    let liveMinute: number | null = null;
    if (isLive) {
        const start = match.secondHalfStartTime || match.actualStartTime;
        if (start) {
            const diff = Date.now() - new Date(start).getTime();
            const base = match.secondHalfStartTime ? 45 : 0;
            liveMinute = base + Math.floor(diff / 60000);
        }
    }

    const currentInjury = match.secondHalfStartTime ? match.injuryTime2 : match.injuryTime1;

    return (
        <Link href={`/matches/${match.id}`}>
            <div className={`w-48 bg-[#2A2A2A] border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_#00ff41] transition-all relative z-10 flex flex-col justify-center cursor-pointer overflow-hidden ${isLive ? 'border-accent-primary' : 'border-black'}`}>
                <div className="flex items-center justify-between px-2 py-0.5 bg-black/40 border-b border-white/5">
                    <span className="text-[7px] font-black text-white/40 uppercase tracking-widest truncate">
                        {match.matchDay ? `Jornada ${match.matchDay}` : 'Partido'}
                    </span>
                    {isLive && (
                        <div className="flex items-center gap-1">
                            <span className="text-[7px] font-black text-red-500 animate-pulse uppercase">{periodLabel}</span>
                            <span className="text-[7px] font-black text-accent-primary tabular-nums">{timerDisplay}</span>
                        </div>
                    )}
                </div>
                {match.groupName && (
                    <div className="bg-accent-primary text-black text-[7px] font-black px-2 py-0.5 border-b border-black uppercase tracking-widest text-center">
                        Grupo {match.groupName}
                    </div>
                )}
                
                

                <TeamRow team={match.homeTeam} goals={match.homeGoals} isWinner={isFinished && match.homeGoals > match.awayGoals} />
                <div className="w-full h-[2px] bg-black" />
                <TeamRow team={match.awayTeam} goals={match.awayGoals} isWinner={isFinished && match.awayGoals > match.homeGoals} />
                
                {match.hasPenalties && isFinished && (
                    <div className="bg-black/80 text-accent-primary text-[8px] font-black px-2 py-0.5 text-center border-t border-black uppercase">
                        Penales: {match.homePenalties} - {match.awayPenalties}
                    </div>
                )}

                <div className="bg-black/40 px-2 py-1 border-t border-black flex items-center gap-1 justify-center">
                    <span className="text-[7px] font-black text-white/40 uppercase truncate">
                        {match.status === 'POSTPONED' ? 'POSTERGADO' : match.status === 'ANNULLED' ? 'ANULADO' : match.status === 'HALFTIME' ? 'ENTREETIEMPO' : (match.stadium || match.homeTeam?.stadium || 'Sede a definir')}
                    </span>
                </div>
            </div>
        </Link>
    );
};

export function AnimatedFixture({ matches }: Props) {
    const matchesByDay = matches.reduce((acc, match) => {
        const day = match.matchDay || 0;
        if (!acc[day]) acc[day] = [];
        acc[day].push(match);
        return acc;
    }, {} as Record<number, Match[]>);

    const days = Object.keys(matchesByDay).map(Number).sort((a, b) => a - b);

    if (matches.length === 0) return null;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    const dayVariants: Variants = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0, transition: { type: 'spring', bounce: 0.4 } }
    };

    return (
        <div className="bg-[#1a1a1a] w-full py-12 px-8 min-h-[600px] border-y-4 border-black mesh-bg relative overflow-hidden group">
            <div className="relative z-10">
                <motion.div
                    className="flex overflow-x-auto gap-16 pb-16 pt-12 no-scrollbar items-start relative z-10"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    {days.map((day, idx) => {
                        const isLast = idx === days.length - 1;
                        return (
                            <motion.div key={day} variants={dayVariants} className="flex flex-col items-center relative flex-shrink-0">
                                <div className="bg-black text-white px-4 py-1.5 whitespace-nowrap border-2 border-[#00ff41] shadow-[0_0_10px_rgba(0,255,65,0.2)] mb-8 z-10 text-[10px] font-black uppercase tracking-widest relative">
                                    {day === 0 ? 'Sin Asignar' : `Jornada ${day}`}
                                    {!isLast && <div className="absolute top-1/2 -right-16 w-16 h-[2px] bg-[#00ff41] -z-10" />}
                                </div>
                                <div className="w-0.5 h-full bg-[#00ff41]/20 absolute top-10 bottom-0 z-0 border-dashed border-l-2 border-[#00ff41]/30"></div>
                                <div className="flex flex-col gap-6 w-48 relative z-10">
                                    {matchesByDay[day].map(m => (
                                        <div key={m.id} className="relative group/match">
                                            <MiniMatchCard match={m} />
                                            {!isLast && <div className="absolute top-1/2 -right-10 w-10 h-[2px] bg-[#00ff41] opacity-50 z-0" />}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}
