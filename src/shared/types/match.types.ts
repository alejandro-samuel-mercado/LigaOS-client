/**
 * Match-related type definitions.
 * Covers match data, real-time events, lineups, and referee assignment.
 */

export enum MatchStatus {
  UPCOMING = 'UPCOMING',
  LIVE = 'LIVE',
  HALFTIME = 'HALFTIME',
  FINISHED = 'FINISHED',
  SUSPENDED = 'SUSPENDED',
}

export enum MatchEventType {
  GOAL = 'GOAL',
  FOUL = 'FOUL',
  YELLOW_CARD = 'YELLOW_CARD',
  RED_CARD = 'RED_CARD',
  SUBSTITUTION = 'SUBSTITUTION',
  WARNING = 'WARNING',
  MATCH_START = 'MATCH_START',
  HALFTIME_START = 'HALFTIME_START',
  HALFTIME_END = 'HALFTIME_END',
  MATCH_END = 'MATCH_END',
}

export enum AssignmentMethod {
  MANUAL = 'MANUAL',
  RANDOM = 'RANDOM',
}

export enum AssignmentStatus {
  PENDING = 'PENDING',
  HOME_ACCEPTED = 'HOME_ACCEPTED',
  AWAY_ACCEPTED = 'AWAY_ACCEPTED',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

export interface MatchData {
  id: string;
  tournamentId: string;
  tournamentName: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo: string | null;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo: string | null;
  stadium: string | null;
  matchDate: string;
  matchTime: string | null;
  status: MatchStatus;
  homeGoals: number;
  awayGoals: number;
  refereeId: string | null;
  refereeName: string | null;
}

export interface MatchEventData {
  id: string;
  matchId: string;
  type: MatchEventType;
  minute: number | null;
  playerId: string | null;
  playerName: string | null;
  teamSide: string | null;
  details: string | null;
  createdAt: string;
}

export interface CreateMatchEventRequest {
  type: MatchEventType;
  minute?: number;
  playerId?: string;
  teamSide?: 'home' | 'away';
  details?: string;
}

export interface MatchLineupData {
  playerId: string;
  playerName: string;
  playerLastName: string;
  position: string;
  number: number | null;
  isStarting: boolean;
  teamSide: 'home' | 'away';
}

export interface RefereeAssignmentData {
  id: string;
  matchId: string;
  refereeId: string;
  refereeName: string;
  method: AssignmentMethod;
  status: AssignmentStatus;
  homeAccepted: boolean;
  awayAccepted: boolean;
}
