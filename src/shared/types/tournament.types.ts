/**
 * Tournament-related type definitions.
 * Includes tournament data, standings, and inscription management.
 */

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  REGISTRATION = 'REGISTRATION',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export enum InscriptionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface TournamentData {
  id: string;
  name: string;
  description: string | null;
  dateStart: string;
  dateEnd: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  status: TournamentStatus;
  createdAt: string;
}

export interface StandingRow {
  teamId: string;
  teamName: string;
  teamLogo: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface CreateTournamentRequest {
  name: string;
  description?: string;
  dateStart: string;
  dateEnd?: string;
  city?: string;
  state?: string;
  category?: string;
}
