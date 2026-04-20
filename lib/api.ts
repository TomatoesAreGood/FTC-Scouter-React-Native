import {
  EventListing, ExtendedEventListing, TeamListing,
  TeamPerformanceData, HybridMatchData, Award,
} from './models';
import { AWARD_NAMES, API_BASE, TOURNAMENT_LEVELS } from './constants';

function makeAuthHeader(user: string, token: string): Record<string, string> {
  const encoded = btoa(`${user}:${token}`);
  return { Authorization: `Basic ${encoded}` };
}

function parseEventList(raw: any[]): EventListing[] {
  const events: EventListing[] = [];
  for (const e of raw) {
    const type = typeof e['type'] === 'string' ? parseInt(e['type']) : e['type'];
    if (type < 12 || type > 16) {
      events.push({
        name: e['name'],
        country: e['country'],
        city: e['city'],
        dateStart: (e['dateStart'] as string).substring(0, 10),
        dateEnd: (e['dateEnd'] as string).substring(0, 10),
        code: e['code'],
        type,
        venue: e['venue'] ?? null,
        website: e['website'] ?? null,
        liveStream: e['liveStreamUrl'] ?? null,
      });
    }
  }
  return events;
}

function parseExtendedEventList(raw: any[]): ExtendedEventListing[] {
  const events: ExtendedEventListing[] = [];
  for (const e of raw) {
    const type = typeof e['type'] === 'string' ? parseInt(e['type']) : e['type'];
    if (type < 12 || type > 16) {
      events.push({
        name: e['name'],
        country: e['country'],
        city: e['city'],
        dateStart: (e['dateStart'] as string).substring(0, 10),
        dateEnd: (e['dateEnd'] as string).substring(0, 10),
        code: e['code'],
        type,
        venue: e['venue'] ?? null,
        website: e['website'] ?? null,
        liveStream: e['liveStreamUrl'] ?? null,
        year: e['year'],
      });
    }
  }
  return events;
}

function parseTeamList(raw: any[]): TeamListing[] {
  return raw.map((t) => ({
    teamNumber: t['teamNumber'],
    rookieYear: t['rookieYear'],
    teamName: t['nameShort'],
    city: t['city'] ?? '',
    stateProv: t['stateProv'] ?? '',
    country: t['country'] ?? '',
    fullTeamName: t['nameFull'] ?? '',
  }));
}

function roundTwo(n: number): number {
  const s = String(n);
  if (s.length > 5) return parseFloat(n.toFixed(2));
  return n;
}

export async function validateCredentials(user: string, token: string): Promise<boolean> {
  if (!user || !token) return false;
  try {
    const res = await fetch(`${API_BASE}/2021`, {
      headers: makeAuthHeader(user, token),
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

export async function fetchEvents(year: string, user: string, token: string): Promise<EventListing[]> {
  const res = await fetch(`${API_BASE}/${year}/events`, {
    headers: makeAuthHeader(user, token),
  });
  if (res.status !== 200) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return parseEventList(json['events']);
}

export async function fetchTeamsPage(
  year: string,
  page: number,
  user: string,
  token: string
): Promise<{ teams: TeamListing[]; pageTotal: number }> {
  const res = await fetch(`${API_BASE}/${year}/teams?page=${page}`, {
    headers: makeAuthHeader(user, token),
  });
  if (res.status !== 200) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return {
    teams: parseTeamList(json['teams']),
    pageTotal: json['pageTotal'] ?? 1,
  };
}

export async function searchTeamByNumber(
  year: string,
  teamNumber: number,
  user: string,
  token: string
): Promise<TeamListing | null> {
  const res = await fetch(`${API_BASE}/${year}/teams?teamNumber=${teamNumber}`, {
    headers: makeAuthHeader(user, token),
  });
  if (res.status !== 200) return null;
  const json = await res.json();
  const teams = parseTeamList(json['teams']);
  return teams.length > 0 ? teams[0] : null;
}

export async function fetchEventRankings(
  year: number,
  code: string,
  user: string,
  token: string
): Promise<TeamPerformanceData[]> {
  const res = await fetch(`${API_BASE}/${year}/rankings/${code}`, {
    headers: makeAuthHeader(user, token),
  });
  if (res.status !== 200) throw new Error(`API error ${res.status}`);
  const text = await res.text();
  if (!text.startsWith('{')) return [];
  const json = JSON.parse(text);
  const rankings = json['rankings'] ?? [];
  return rankings.map((r: any) => ({
    rank: r['rank'],
    teamNumber: r['teamNumber'],
    teamName: r['teamName'] ?? null,
    wins: r['wins'],
    ties: r['ties'],
    losses: r['losses'],
    rankingPoints: roundTwo(r['sortOrder1']),
    tieBreakerPoints: roundTwo(r['sortOrder2']),
  }));
}

function parseSchedule(raw: any[]): HybridMatchData[] {
  return raw.map((s: any) => {
    const blue: number[] = [];
    const red: number[] = [];
    for (const t of s['teams']) {
      if ((t['station'] as string).startsWith('Red')) {
        red.push(t['teamNumber'] ?? 0);
      } else {
        blue.push(t['teamNumber'] ?? 0);
      }
    }
    return {
      blueTeam: blue,
      redTeam: red,
      scoreBlueFinal: s['scoreBlueFinal'] ?? 0,
      scoreRedFinal: s['scoreRedFinal'] ?? 0,
      matchNumber: s['matchNumber'],
      seriesNumber: s['series'],
      tournamentLevel: TOURNAMENT_LEVELS[s['tournamentLevel']] ?? 0,
      isRedWin: s['redWins'],
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
    fetch(`${API_BASE}/${year}/schedule/${code}/qual/hybrid`, { headers: makeAuthHeader(user, token) }),
    fetch(`${API_BASE}/${year}/schedule/${code}/playoff/hybrid`, { headers: makeAuthHeader(user, token) }),
  ]);

  const result: HybridMatchData[][] = [];

  if (qualRes.status === 200) {
    const json = await qualRes.json();
    result.push(parseSchedule(json['schedule'] ?? []));
  }

  if (playoffRes.status === 200) {
    const json = await playoffRes.json();
    const playoffMatches = parseSchedule(json['schedule'] ?? []);
    const semis = playoffMatches.filter((m) => m.tournamentLevel === TOURNAMENT_LEVELS.SEMIFINAL);
    const finals = playoffMatches.filter((m) => m.tournamentLevel === TOURNAMENT_LEVELS.FINAL);
    const playoffs = playoffMatches.filter((m) => m.tournamentLevel === TOURNAMENT_LEVELS.PLAYOFF);

    if (playoffs.length > 0) {
      result.push(playoffs);
    } else {
      if (semis.length > 0) result.push(semis);
      if (finals.length > 0) result.push(finals);
    }
  }

  return result;
}

export async function fetchEventAwards(
  year: number,
  code: string,
  user: string,
  token: string
): Promise<Award[]> {
  const res = await fetch(`${API_BASE}/${year}/awards/${code}`, {
    headers: makeAuthHeader(user, token),
  });
  if (res.status !== 200) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  const awards: Award[] = [];
  for (const a of json['awards']) {
    if (AWARD_NAMES[a['awardId']] && a['teamNumber'] != null) {
      awards.push({
        awardId: a['awardId'],
        series: a['series'],
        teamNumber: a['teamNumber'],
        name: AWARD_NAMES[a['awardId']] ?? null,
        person: a['person'] ?? null,
      });
    }
  }
  return awards;
}

export async function fetchTeamEvents(
  year: number,
  teamNumber: number,
  user: string,
  token: string
): Promise<EventListing[]> {
  const res = await fetch(`${API_BASE}/${year}/events?teamNumber=${teamNumber}`, {
    headers: makeAuthHeader(user, token),
  });
  if (res.status !== 200) return [];
  const text = await res.text();
  if (!text.startsWith('{')) return [];
  const json = JSON.parse(text);
  return parseEventList(json['events'] ?? []);
}
