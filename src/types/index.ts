export interface TeamPreview {
  id: string;
  name: string;
  nameShort: string | null;
  logo: string | null;
  city?: string;
  _count?: { players: number };
}

export interface Team {
  id: string;
  name: string;
  nameShort: string | null;
  description: string | null;
  logo: string | null;
  city: string;
  state: string;
  stadium: string | null;
  phone: string | null;
  email: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  president?: { id: string; name: string; lastName: string; image?: string };
  coach?: { id: string; name: string; lastName: string; image?: string };
  players: TeamMembership[];
}

export interface TeamMembership {
  id: string;
  number: number | null;
  position: string | null;
  isActive: boolean;
  joinedAt: string;
  leftAt: string | null;
  teamRole?: 'PRESIDENT' | 'COACH' | 'PLAYER' | 'STAFF';
  player: PlayerPreview;
}

export interface PlayerPreview {
  id: string;
  name: string;
  lastName: string;
  image: string | null;
  phone?: string;
  dni?: string;
  birthdate?: string;
  publicFields?: string[];
  role?: string;
}

export interface PlayerDetail extends PlayerPreview {
  playerStatus: 'ACTIVE' | 'INJURED' | 'RESTING' | 'INACTIVE';
  teamMemberships: Array<{
    team: { id: string; name: string; logo: string | null };
    number: number | null;
    position: string | null;
    isActive: boolean;
  }>;
  stats: {
    goals: number;
    fouls: number;
    matchesPlayed: number;
    matchesWon: number;
  };
  playerPrizes: Array<{
    id: string;
    title: string;
    year: number;
    description: string | null;
  }>;
}

export type MatchStatus = 'UPCOMING' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'ANNULLED';

export interface MatchPreview {
  id: string;
  matchDate: string;
  matchTime: string | null;
  status: MatchStatus;
  homeGoals: number;
  awayGoals: number;
  homeTeam: TeamPreview;
  awayTeam: TeamPreview;
  tournament: { id: string; name: string };
  updatedAt: string;
  injuryTime1?: number | null;
  injuryTime2?: number | null;
  stadium?: string | null;
  groupName?: string | null;
  hasExtraTime?: boolean;
  hasPenalties?: boolean;
  homePenalties?: number | null;
  awayPenalties?: number | null;
}

export interface Match extends MatchPreview {
  referee?: { id: string; name: string; lastName: string };
  refereeAssignment?: {
    status: string;
    referee: { id: string; name: string; lastName: string };
  };
  events: MatchEvent[];
  actualStartTime?: string | null;
  secondHalfStartTime?: string | null;
  stream?: { streamUrl: string; isActive?: boolean } | null;
}

export interface MatchEvent {
  id: string;
  type: string;
  minute?: number;
  teamSide?: 'home' | 'away';
  details?: string;
  corrected?: boolean;
  player?: { name: string; lastName: string };
}

export type TournamentStatus = 'DRAFT' | 'REGISTRATION' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
export type TournamentType = 'LEAGUE' | 'ELIMINATION' | 'GROUPS_ELIMINATION';

export interface TournamentPreview {
  id: string;
  name: string;
  status: TournamentStatus;
  dateStart: string;
  city: string | null;
  category: string | null;
  _count?: { teams: number; matches: number };
}

export interface Tournament extends TournamentPreview {
  description: string | null;
  dateEnd: string | null;
  state: string | null;
  division: string | null;
  type: TournamentType;
  winnerId?: string | null;
  frozenAt?: string | null;
  winner?: { id: string; name: string } | null;
  teams: any[];
  standings: any[];
  matches: any[];
}

export interface UserPreview {
  id: string;
  name: string;
  lastName: string;
  email: string;
  role: string;
  image: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  lastName: string;
  role: string;
  status: string;
  image: string | null;
  publicFields: string[];
}

export interface Publication {
  id: string;
  text: string;
  images?: string[];
  createdAt: string;
  author: { id: string; name: string; lastName: string; image: string | null };
  _count?: { likes: number; comments: number };
}

export interface PaginationData {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type NotificationType =
  | 'MATCH_REMINDER' | 'MATCH_STARTED' | 'GOAL_SCORED' | 'MATCH_FINISHED'
  | 'TEAM_INVITATION' | 'LINEUP_ANNOUNCED' | 'REFEREE_REQUEST'
  | 'TOURNAMENT_ENROLLMENT' | 'CARD_RECEIVED' | 'NEW_PUBLICATION'
  | 'INVITATION_ACCEPTED' | 'INVITATION_REJECTED' | 'GENERAL';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  matchId?: string | null;
  teamId?: string | null;
  tournamentId?: string | null;
  createdAt: string;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type TeamRole = 'PRESIDENT' | 'COACH' | 'PLAYER' | 'STAFF';

export interface TeamInvitation {
  id: string;
  teamId: string;
  invitedUserId: string;
  invitedByUserId: string;
  teamRole: TeamRole;
  status: InvitationStatus;
  message?: string | null;
  createdAt: string;
  respondedAt?: string | null;
  team?: { id: string; name: string; logo?: string | null; city?: string };
  invitedUser?: { id: string; name: string; lastName: string; image?: string | null };
  invitedByUser?: { id: string; name: string; lastName: string };
}

export interface FavoriteTeam {
  id: string;
  userId: string;
  teamId: string;
  createdAt: string;
  team?: TeamPreview;
}

export interface TopScorer {
  position: number;
  player: PlayerPreview | null;
  team: TeamPreview | null;
  goals: number;
  matchesPlayed: number;
}

export interface TeamStreak {
  results: Array<{
    matchId: string;
    result: 'W' | 'D' | 'L';
    goalsFor: number;
    goalsAgainst: number;
    date: string;
  }>;
  currentStreak: { type: 'W' | 'D' | 'L' | null; count: number };
  unbeatenRun: number;
}

export interface HeadToHead {
  totalMatches: number;
  teamAWins: number;
  teamBWins: number;
  draws: number;
  teamAGoals: number;
  teamBGoals: number;
  matches: Array<{
    id: string;
    homeTeamId: string;
    awayTeamId: string;
    homeGoals: number;
    awayGoals: number;
    date: string;
    tournament: { id: string; name: string } | null;
  }>;
}

export interface RefereePreview {
  id: string;
  name: string;
  lastName: string;
  image: string | null;
  phone?: string;
  city?: string;
  state?: string;
  _count?: { refereedMatches: number };
}

