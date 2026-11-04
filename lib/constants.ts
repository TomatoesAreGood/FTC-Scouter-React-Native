import { SeasonSummary } from './models';

const FIRST_SEASON = 2019;

/**
 * FTC seasons kick off in September and the API names a season by its starting year
 * (e.g. 2025 = the 2025-26 season). This date-based guess is only used until the API
 * reports its newest season (see AppContext), which is authoritative: the API rejects
 * seasons it hasn't activated yet.
 */
export function getCurrentSeason(now: Date = new Date()): number {
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}

/** Seasons from 2019 to `latest`, oldest first. */
export function buildSeasonList(latest: number): string[] {
  const last = Math.max(FIRST_SEASON, latest);
  return Array.from({ length: last - FIRST_SEASON + 1 }, (_, i) => String(FIRST_SEASON + i));
}

export const FALLBACK_SEASONS = buildSeasonList(getCurrentSeason());
export const FALLBACK_CURRENT_SEASON = FALLBACK_SEASONS[FALLBACK_SEASONS.length - 1];

/**
 * Game names and kickoff dates as reported by GET /v2.0/{season}. Used until the API
 * responds (or if it can't be reached); the live values take precedence.
 */
export const KNOWN_SEASONS: Record<string, SeasonSummary> = {
  '2019': { gameName: 'SKYSTONE', kickoff: '2019-09-07' },
  '2020': { gameName: 'ULTIMATE GOAL', kickoff: '2020-09-12' },
  '2021': { gameName: 'FREIGHT FRENZY', kickoff: '2021-09-18' },
  '2022': { gameName: 'POWERPLAY', kickoff: '2022-09-10' },
  '2023': { gameName: 'CENTERSTAGE', kickoff: '2023-09-09' },
  '2024': { gameName: 'INTO THE DEEP', kickoff: '2024-09-07' },
  '2025': { gameName: 'DECODE', kickoff: '2025-09-06' },
  '2026': { gameName: 'BIOBUZZ', kickoff: '2026-09-12' },
};

/** Kickoff date used to group events into weeks. */
export function getSeasonStartDate(year: string, summary?: SeasonSummary): string {
  if (summary?.kickoff) return summary.kickoff;
  if (KNOWN_SEASONS[year]?.kickoff) return KNOWN_SEASONS[year].kickoff!;
  // Unknown future season: the first Saturday on/after Sept 6 matches most past kickoffs.
  const d = new Date(Date.UTC(parseInt(year, 10), 8, 6));
  d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7));
  return d.toISOString().substring(0, 10);
}

/** Seasons are shown by their starting year, as the FTC API names them ("2025"). */
export function formatSeason(year: string | number): string {
  return String(year);
}

export const EVENT_TYPES: Record<number, string> = {
  0: 'Non-Advancement',
  1: 'League Meet',
  2: 'Qualifier',
  3: 'League Tournament',
  4: 'Championship',
  5: 'Other',
  6: 'FIRST Championship',
  7: 'Super Qualifier',
  9: 'Innovation Challenge',
  10: 'Off-Season',
  17: 'Premier',
};

/** Prefer the type name the API sent with the event; fall back for older saved favorites. */
export function getEventTypeName(event: { type: number; typeName?: string | null }): string {
  return event.typeName || EVENT_TYPES[event.type] || 'Other';
}

// Display order for the type filter (roughly by competition level). Types not listed
// here, e.g. ones introduced in a future season, are appended alphabetically.
const TYPE_ORDER = [1, 3, 2, 7, 4, 17, 6, 0, 10, 9, 5];

/** Type-filter options for the event types actually present in a season's events. */
export function getEventTypeOptions(events: { type: number; typeName?: string | null }[]): { value: number; label: string }[] {
  const seen = new Map<number, string>();
  for (const e of events) if (!seen.has(e.type)) seen.set(e.type, getEventTypeName(e));
  const ordered = [...seen.entries()].sort(([a, la], [b, lb]) => {
    const ia = TYPE_ORDER.indexOf(a);
    const ib = TYPE_ORDER.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return la.localeCompare(lb);
  });
  return [{ value: -1, label: 'All' }, ...ordered.map(([value, label]) => ({ value, label }))];
}

export const AWARD_NAMES: Record<number, string> = {
  1: "Judges' Choice Award",
  2: 'Compass Award',
  3: 'Promote Award',
  4: 'Control Award',
  5: 'Motivate Award',
  6: 'Design Award',
  7: 'Innovate Award',
  8: 'Connect Award',
  9: 'Think Award',
  10: "Dean's List Finalists",
  11: 'Inspire Award',
  12: 'Finalist Alliance',
  13: 'Winning Alliance',
};

export const TOURNAMENT_LEVELS: Record<string, number> = {
  OTHER: 0,
  QUALIFICATION: 1,
  SEMIFINAL: 2,
  FINAL: 3,
  PLAYOFF: 4,
};

export const API_BASE = 'https://ftc-api.firstinspires.org/v2.0';
