/**
 * Player-related type definitions.
 * Includes player status, stats, and tournament performance.
 */

export enum PlayerStatus {
  ACTIVE = 'ACTIVE',
  INJURED = 'INJURED',
  RESTING = 'RESTING',
  INACTIVE = 'INACTIVE',
}

export interface PlayerData {
  id: string;
  name: string;
  lastName: string;
  dni: string | null;
  phone: string | null;
  position: string | null;
  number: number | null;
  status: PlayerStatus;
  image: string | null;
  teamId: string | null;
  teamName: string | null;
}

export interface PlayerStats {
  goals: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
}

export interface UpdatePlayerSportsDataRequest {
  position?: string;
  number?: number;
  playerStatus?: PlayerStatus;
}
