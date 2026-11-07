import {
  EventListing, TeamListing, TeamPerformanceData, HybridMatchData, Award, MatchTeam, SeasonSummary,
} from './models';
import { AWARD_NAMES, API_BASE, TOURNAMENT_LEVELS } from './constants';

const REQUEST_TIMEOUT_MS = 20000;

/**
 * fetch with a timeout, so a stalled connection (common on venue wifi) surfaces as an
 * error with a Retry button instead of an endless spinner. The timer is intentionally
 * left running until it fires so it also covers reading the response body; aborting an
 * already-completed request is a no-op.
 */
function apiFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal });
}

function makeAuthHeader(user: string, token: string): Record<string, string> {
  const encoded = btoa(`${user}:${token}`);
  return { Authorization: `Basic ${encoded}` };
}

// Types 12–16 are Kickoff, Workshop, Demo/Exhibition, Volunteer Signup and Practice Day:
// listings with no competition data, so they're left out of the app.
const NON_COMPETITION_TYPES = new Set([12, 13, 14, 15, 16]);

function parseEventList(raw: any[]): EventListing[] {
  const events: EventListing[] = [];
  for (const e of raw) {
    const type = typeof e['type'] === 'string' ? parseInt(e['type'], 10) : e['type'];
    if (NON_COMPETITION_TYPES.has(type)) continue;
    events.push({
      name: e['name'] ?? '',
      country: e['country'] ?? '',
      city: e['city'] ?? '',
      dateStart: String(e['dateStart'] ?? '').substring(0, 10),
      dateEnd: String(e['dateEnd'] ?? '').substring(0, 10),
      code: e['code'],
      type,
      typeName: typeof e['typeName'] === 'string' ? e['typeName'] : null,
      remote: e['remote'] === true,
      hybrid: e['hybrid'] === true,
      divisionCode: e['divisionCode'] || null,
      venue: e['venue'] ?? null,
      website: e['website'] ?? null,
      liveStream: e['liveStreamUrl'] ?? null,
    });
  }
  return events;
}

function parseTeamList(raw: any[]): TeamListing[] {
  return raw.map((t) => ({
    teamNumber: t['teamNumber'],
    rookieYear: t['rookieYear'],
    teamName: t['nameShort'] ?? '',
    city: t['city'] ?? '',
    stateProv: t['stateProv'] ?? '',
    country: t['country'] ?? '',
    fullTeamName: t['nameFull'] ?? '',
  }));
}

function num(n: unknown): number {
  return typeof n === 'number' && isFinite(n) ? n : 0;
}

export type CredentialCheck = 'valid' | 'invalid' | 'network-error';

export async function validateCredentials(user: string, token: string): Promise<CredentialCheck> {
  if (!user || !token) return 'invalid';
  try {
    const res = await apiFetch(`${API_BASE}/2021`, {
      headers: makeAuthHeader(user, token),
    });
    return res.status === 200 ? 'valid' : 'invalid';
  } catch {
    return 'network-error';
  }
}

/** The newest season the API serves (it rejects anything later with HTTP 400). */
export async function fetchMaxSeason(user: string, token: string): Promise<number | null> {
  const res = await apiFetch(API_BASE, { headers: makeAuthHeader(user, token) });
  if (res.status !== 200) return null;
  const json = await res.json();
  const max = json['maxSeason'] ?? json['currentSeason'];
  return typeof max === 'number' ? max : null;
}

/** Game name and kickoff date for a season. */
export async function fetchSeasonSummary(year: string, user: string, token: string): Promise<SeasonSummary> {
  const res = await apiFetch(`${API_BASE}/${year}`, { headers: makeAuthHeader(user, token) });
  if (res.status !== 200) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  const gameName = typeof json['gameName'] === 'string' && json['gameName'].trim() ? json['gameName'].trim() : null;
  const kickoff = typeof json['kickoff'] === 'string' && json['kickoff'].length >= 10 ? json['kickoff'].substring(0, 10) : null;
  return { gameName, kickoff };
}

export async function fetchEvents(year: string, user: string, token: string): Promise<EventListing[]> {
  const res = await apiFetch(`${API_BASE}/${year}/events`, {
    headers: makeAuthHeader(user, token),
  });
  if (res.status !== 200) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return parseEventList(json['events'] ?? []);
}

export async function fetchTeamsPage(
  year: string,
  page: number,
  user: string,
  token: string
): Promise<{ teams: TeamListing[]; pageTotal: number }> {
  const res = await apiFetch(`${API_BASE}/${year}/teams?page=${page}`, {
    headers: makeAuthHeader(user, token),
  });
  if (res.status !== 200) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return {
    teams: parseTeamList(json['teams'] ?? []),
    pageTotal: json['pageTotal'] ?? 1,
  };
}

/**
 * Teams registered for an event. Unlike rankings, this is available before the event
 * is played, and for events split into divisions it lists every division's teams.
 */
export async function fetchEventTeams(
  year: number,
  code: string,
  user: string,
  token: string
): Promise<TeamListing[]> {
  const teams: TeamListing[] = [];
  let page = 1;
  let pageTotal = 1;
  do {
    const res = await apiFetch(`${API_BASE}/${year}/teams?eventCode=${code}&page=${page}`, {
      headers: makeAuthHeader(user, token),
    });
    if (res.status !== 200) throw new Error(`API error ${res.status}`);
    const json = await res.json();
    teams.push(...parseTeamList(json['teams'] ?? []));
    pageTotal = typeof json['pageTotal'] === 'number' ? json['pageTotal'] : 1;
    page++;
  } while (page <= pageTotal);
  return teams;
}

export async function searchTeamByNumber(
  year: string,
  teamNumber: number,
  user: string,
  token: string
): Promise<TeamListing | null> {
  const res = await apiFetch(`${API_BASE}/${year}/teams?teamNumber=${teamNumber}`, {
    headers: makeAuthHeader(user, token),
  });
  if (res.status !== 200) return null;
  const json = await res.json();
  const teams = parseTeamList(json['teams'] ?? []);
  return teams.length > 0 ? teams[0] : null;
}

export async function fetchEventRankings(
  year: number,
  code: string,
  user: string,
  token: string
): Promise<TeamPerformanceData[]> {
  const res = await apiFetch(`${API_BASE}/${year}/rankings/${code}`, {
    headers: makeAuthHeader(user, token),
  });
  if (res.status !== 200) throw new Error(`API error ${res.status}`);
  const text = await res.text();
  if (!text.startsWith('{')) return [];
  const json = JSON.parse(text);
  const rankings = json['rankings'] ?? [];
  return rankings.map((r: any) => ({
    rank: num(r['rank']),
    teamNumber: r['teamNumber'],
    teamName: r['teamName'] ?? null,
    wins: num(r['wins']),
    ties: num(r['ties']),
    losses: num(r['losses']),
    matchesPlayed: num(r['matchesPlayed']),
    sortOrders: [1, 2, 3, 4, 5, 6].map((i) => num(r[`sortOrder${i}`])),
  }));
}

function stationOrder(station: string): number {
  const n = parseInt(station.replace(/\D/g, ''), 10);
  return isNaN(n) ? 99 : n;
}

/**
 * Splits a match's teams into red / blue alliances, or `solo` for remote matches
 * (station "1", one team, no alliance). Empty slots (station "Blue0", no team number)
 * are byes and are dropped. On a 3-team alliance the API marks the team that sat out
 * with onField=false; older seasons report onField=false for everyone, so a team only
 * counts as sitting out when an alliance-mate in the same match is on the field.
 */
/**
 * Match times arrive as the event's local wall-clock time without a zone, e.g.
 * "2026-11-07T11:15:45.046". Keep "YYYY-MM-DDTHH:MM" as text (converting through Date
 * would shift it into the phone's time zone). Old and remote events send the placeholder
 * "0001-01-01T…" for times that were never recorded; treat those as missing.
 */
function parseLocalTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m || Number(m[1]) < 2000) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
}

function parseSchedule(raw: any[]): HybridMatchData[] {
  return raw.map((s: any) => {
    const groups: Record<'red' | 'blue' | 'solo', { station: string; onField: boolean; team: MatchTeam }[]> = {
      red: [], blue: [], solo: [],
    };
    for (const t of s['teams'] ?? []) {
      if (t['teamNumber'] == null) continue;
      const station = String(t['station'] ?? '');
      const key = station.startsWith('Red') ? 'red' : station.startsWith('Blue') ? 'blue' : 'solo';
      groups[key].push({
        station,
        onField: t['onField'] === true,
        team: {
          teamNumber: t['teamNumber'],
          surrogate: t['surrogate'] === true,
          dq: t['dq'] === true,
          noShow: t['noShow'] === true,
          sittingOut: false,
        },
      });
    }
    const finish = (list: (typeof groups)['red']) => {
      const anyOnField = list.some((x) => x.onField);
      return list
        .sort((a, b) => stationOrder(a.station) - stationOrder(b.station))
        .map((x) => ({ ...x.team, sittingOut: anyOnField && !x.onField }));
    };
    return {
      red: finish(groups.red),
      blue: finish(groups.blue),
      solo: finish(groups.solo),
      scoreBlueFinal: s['scoreBlueFinal'] ?? null,
      scoreRedFinal: s['scoreRedFinal'] ?? null,
      matchNumber: s['matchNumber'],
      seriesNumber: s['series'],
      tournamentLevel: TOURNAMENT_LEVELS[s['tournamentLevel']] ?? 0,
      description: typeof s['description'] === 'string' ? s['description'].replace(/\s+/g, ' ').trim() : null,
      isRedWin: s['redWins'] === true,
      isBlueWin: s['blueWins'] === true,
      scheduledTime: parseLocalTime(s['startTime']),
      actualTime: parseLocalTime(s['actualStartTime']),
    };
  });
}

export async function fetchEventSchedule(
  year: number,
  code: string,
  user: string,
  token: string
): Promise<HybridMatchData[][]> {
  const [qualRes, playoffRes] = await Promise.all([
    apiFetch(`${API_BASE}/${year}/schedule/${code}/qual/hybrid`, { headers: makeAuthHeader(user, token) }),
    apiFetch(`${API_BASE}/${year}/schedule/${code}/playoff/hybrid`, { headers: makeAuthHeader(user, token) }),
  ]);

  const result: HybridMatchData[][] = [];

  if (qualRes.status === 200) {
    const json = await qualRes.json();
    result.push(parseSchedule(json['schedule'] ?? []));
  }

  if (playoffRes.status === 200) {
    const json = await playoffRes.json();
    const playoffMatches = parseSchedule(json['schedule'] ?? []);
    // 2019–2023: semifinals + finals. 2024+: one double-elimination "PLAYOFF" bracket.
    const semis = playoffMatches.filter((m) => m.tournamentLevel === TOURNAMENT_LEVELS.SEMIFINAL);
    const finals = playoffMatches.filter((m) => m.tournamentLevel === TOURNAMENT_LEVELS.FINAL);
    const playoffs = playoffMatches.filter((m) => m.tournamentLevel === TOURNAMENT_LEVELS.PLAYOFF);

    if (playoffs.length > 0) result.push(playoffs);
    if (semis.length > 0) result.push(semis);
    if (finals.length > 0) result.push(finals);
  }

  return result;
}

/**
 * The API names each award entry individually, e.g. "Inspire Award 2nd Place" or
 * "Winning Alliance - 1st Team Selected". Split that into the award (for grouping) and
 * the placement/role (shown on the recipient's row).
 */
export function splitAwardName(raw: string): { name: string; detail: string | null } {
  const place = raw.match(/^(.*?)\s+(\d+(?:st|nd|rd|th) Place)$/i);
  if (place) return { name: place[1], detail: place[2] };
  const role = raw.match(/^(.*?)\s+-\s+(.+)$/);
  if (role) return { name: role[1], detail: role[2] };
  return { name: raw, detail: null };
}

export async function fetchEventAwards(
  year: number,
  code: string,
  user: string,
  token: string
): Promise<Award[]> {
  const res = await apiFetch(`${API_BASE}/${year}/awards/${code}`, {
    headers: makeAuthHeader(user, token),
  });
  if (res.status !== 200) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  const awards: Award[] = [];
  for (const a of json['awards'] ?? []) {
    const teamNumber = a['teamNumber'] ?? null;
    const person = typeof a['person'] === 'string' && a['person'].trim() ? a['person'].trim() : null;
    // Entries with neither a team nor a person are placeholders for awards not given.
    if (teamNumber == null && !person) continue;
    // Use the API's own name so awards added in later seasons show up correctly.
    const rawName = typeof a['name'] === 'string' && a['name'].trim() ? a['name'].trim() : AWARD_NAMES[a['awardId']] ?? 'Award';
    const { name, detail } = splitAwardName(rawName);
    awards.push({ awardId: a['awardId'], series: num(a['series']), teamNumber, name, detail, person });
  }
  return awards;
}

export async function fetchTeamEvents(
  year: number,
  teamNumber: number,
  user: string,
  token: string
): Promise<EventListing[]> {
  const res = await apiFetch(`${API_BASE}/${year}/events?teamNumber=${teamNumber}`, {
    headers: makeAuthHeader(user, token),
  });
  // An error must surface as an error (with Retry), not be cached as "no events".
  if (res.status !== 200) throw new Error(`API error ${res.status}`);
  const text = await res.text();
  if (!text.startsWith('{')) return [];
  const json = JSON.parse(text);
  return parseEventList(json['events'] ?? []);
}
