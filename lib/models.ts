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
  // Optional so events saved to favorites by older app versions still load.
  /** Type name as the API reports it for that season, e.g. "Premier", "Innovation Challenge". */
  typeName?: string | null;
  /** Remote events (mostly 2020–21): teams play solo matches on their own field. */
  remote?: boolean;
  /** Hybrid events mix in-person and remote play. */
  hybrid?: boolean;
  /** For a division (e.g. a World Championship division), the parent event's code. */
  divisionCode?: string | null;
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
  matchesPlayed: number;
  /**
   * sortOrder1..sortOrder6 from the API. What each one means changes every season
   * (see lib/seasons.ts for the labels).
   */
  sortOrders: number[];
}

export interface MatchTeam {
  teamNumber: number;
  surrogate: boolean;
  dq: boolean;
  noShow: boolean;
  /** On a 3-team alliance, the team that sat this match out. */
  sittingOut: boolean;
}

export interface HybridMatchData {
  red: MatchTeam[];
  blue: MatchTeam[];
  /** Remote events: a single team plays alone (no alliances). */
  solo: MatchTeam[];
  /** null until the match has been played */
  scoreRedFinal: number | null;
  scoreBlueFinal: number | null;
  matchNumber: number;
  seriesNumber: number;
  tournamentLevel: number;
  /** e.g. "Upper Bracket Round 1 Match 1"; used to label playoff matches */
  description: string | null;
  isRedWin: boolean;
  isBlueWin: boolean;
  /**
   * Scheduled start, as the event's local wall-clock time ("2026-11-07T11:00"; the API
   * sends no time zone). null when the API has no real time (it sends 0001-01-01).
   */
  scheduledTime: string | null;
  /** When the match actually started, same format; null until it has been played. */
  actualTime: string | null;
}

export interface Award {
  teamNumber: number | null;
  awardId: number;
  series: number;
  /** Award name for grouping, without placement/role, e.g. "Inspire Award". */
  name: string | null;
  /** Placement or alliance role from the API name, e.g. "2nd Place", "Captain". */
  detail: string | null;
  person: string | null;
}

export interface YearlyTeamListing {
  page: number;
  pageTotal: number;
  teams: TeamListing[];
}

export interface SeasonSummary {
  gameName: string | null;
  /** YYYY-MM-DD */
  kickoff: string | null;
}
