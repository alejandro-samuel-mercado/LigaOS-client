/**
 * Team-related type definitions.
 * Includes team data, statistics, and historical records.
 */

export interface TeamData {
  id: string;
  name: string;
  nameShort: string | null;
  description: string | null;
  isActive: boolean;
  logo: string | null;
  imageEmblem: string | null;
  district: string | null;
  city: string;
  state: string;
  country: string;
  stadium: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  division: string | null;
  instagram: string | null;
  facebook: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  colorTertiary: string | null;
  presidentId: string | null;
  coachId: string | null;
  createdAt: string;
}

export interface TeamStats {
  matchesPlayed: number;
  won: number;
  lost: number;
  drawn: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface CreateTeamRequest {
  name: string;
  nameShort?: string;
  description?: string;
  city: string;
  state: string;
  country?: string;
  stadium?: string;
  phone?: string;
  email?: string;
  category?: string;
  division?: string;
  colorPrimary?: string;
  colorSecondary?: string;
  colorTertiary?: string;
}

export interface UpdateTeamRequest extends Partial<CreateTeamRequest> {
  instagram?: string;
  facebook?: string;
  coachId?: string;
}

export interface TeamPlayerRecord {
  id: string;
  playerId: string;
  playerName: string;
  playerLastName: string;
  number: number | null;
  position: string | null;
  joinedAt: string;
  leftAt: string | null;
  isActive: boolean;
}
