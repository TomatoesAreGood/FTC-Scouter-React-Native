export interface EventListing {
  name: string;
  country: string;
  city: string;
  dateStart: string;
  dateEnd: string;
  code: string;
  venue: string | null;
  website: string | null;
  liveStream: string | null;
  type: number;
}

export interface ExtendedEventListing extends EventListing {
  year: number;
}

export interface TeamListing {
  teamNumber: number;
  rookieYear: number;
  teamName: string;
  city: string;
  stateProv: string;
  country: string;
  fullTeamName: string;
}

export interface ExtendedTeamListing extends TeamListing {
  year: number;
}

export interface TeamPerformanceData {
  rank: number;
  teamNumber: number;
  teamName: string | null;
  wins: number;
  ties: number;
  losses: number;
  rankingPoints: number;
  tieBreakerPoints: number;
}

export interface HybridMatchData {
  blueTeam: number[];
  redTeam: number[];
  scoreRedFinal: number;
  scoreBlueFinal: number;
  matchNumber: number;
  seriesNumber: number;
  tournamentLevel: number;
  isRedWin: boolean;
}

export interface Award {
  teamNumber: number | null;
  awardId: number;
  series: number;
  name: string | null;
  person: string | null;
}

export interface YearlyTeamListing {
  page: number;
  teams: TeamListing[];
}
