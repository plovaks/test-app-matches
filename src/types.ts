export type Team = {
  id: string;
  name: string;
  city: string;
};

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed';

export type Score = {
  home: number;
  away: number;
};

export type Match = {
  id: string;
  startsAt: string | null;
  status: MatchStatus;
  minute?: number;         
  home: Team;
  away: Team;
  score: Score | null;
};

export type Filter = 'all' | 'upcoming' | 'finished' | 'live';