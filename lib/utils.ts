import { Alert, Linking } from 'react-native';
import { EventListing } from './models';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Days since the epoch for a YYYY-MM-DD string (UTC, so no timezone drift). */
export function getDayNumber(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00Z');
  return Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
}

/** Today's local date as a day number comparable with getDayNumber(). */
export function getTodayDayNumber(): number {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / (1000 * 60 * 60 * 24));
}

/** Sort by start date, then name. */
export function sortEventsByDate(list: EventListing[]): EventListing[] {
  return [...list].sort(
    (a, b) => a.dateStart.localeCompare(b.dateStart) || a.name.localeCompare(b.name)
  );
}

/**
 * Splits a date-sorted list into weeks. Week index i holds events starting on day
 * (seasonStart + (i - 1) * 7, seasonStart + i * 7]; index 0 also holds anything before kickoff.
 */
export function splitWeeks(seasonStart: string, dataList: EventListing[]): EventListing[][] {
  const weeks: EventListing[][] = [];
  let i = 0;
  let j = 0;
  let k = getDayNumber(seasonStart);

  while (j < dataList.length) {
    if (getDayNumber(dataList[j].dateStart) > k) {
      weeks.push([]);
    } else {
      while (j < dataList.length && getDayNumber(dataList[j].dateStart) <= k) {
        j++;
      }
      weeks.push(dataList.slice(i, j));
      i = j;
    }
    k += 7;
  }
  return weeks;
}

/** Index of the week (as produced by splitWeeks) that contains the given day. */
export function getWeekIndexForDay(seasonStart: string, day: number): number {
  return Math.max(0, Math.ceil((day - getDayNumber(seasonStart)) / 7));
}

/** Date range covered by week index `weekIndex` from splitWeeks. */
export function getWeekDateRange(seasonStart: string, weekIndex: number): string {
  const endDay = getDayNumber(seasonStart) + weekIndex * 7;
  const toIso = (day: number) => new Date(day * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  return formatDateRange(toIso(endDay - 6), toIso(endDay));
}

/** "2024-11-02", "2024-11-03" -> "Nov 2–3, 2024" */
export function formatDateRange(start: string, end?: string | null): string {
  if (!start) return '';
  const [sy, sm, sd] = start.split('-').map((n) => parseInt(n, 10));
  if (!sy || !sm || !sd) return start;
  const startLabel = `${MONTHS_SHORT[sm - 1]} ${sd}`;
  if (!end || end === start) return `${startLabel}, ${sy}`;
  const [ey, em, ed] = end.split('-').map((n) => parseInt(n, 10));
  if (!ey || !em || !ed) return `${startLabel}, ${sy}`;
  if (sy !== ey) return `${startLabel}, ${sy} – ${MONTHS_SHORT[em - 1]} ${ed}, ${ey}`;
  if (sm !== em) return `${startLabel} – ${MONTHS_SHORT[em - 1]} ${ed}, ${sy}`;
  return `${startLabel}–${ed}, ${sy}`;
}

export function parseTeamFullName(fullTeamName: string): { school: string | null; sponsors: string | null } {
  let school: string | null = null;
  let sponsors: string | null = null;
  if (!fullTeamName) return { school, sponsors };

  if (fullTeamName.includes('Family/Community')) {
    school = 'Family/Community';
  } else if (fullTeamName.includes('&')) {
    const ampIdx = fullTeamName.lastIndexOf('&');
    let schoolRaw = fullTeamName.substring(ampIdx + 1);
    if (schoolRaw.startsWith(' ')) schoolRaw = schoolRaw.substring(1);
    school = schoolRaw;
    const beforeAmp = fullTeamName.substring(0, ampIdx);
    if (beforeAmp.includes('/')) {
      sponsors = beforeAmp.split('/').join(', ');
    } else if (beforeAmp.length > 0) {
      sponsors = beforeAmp;
    }
  } else if (!fullTeamName.includes('/')) {
    school = fullTeamName;
  } else {
    sponsors = fullTeamName.split('/').join(', ');
  }

  return { school, sponsors };
}

export function getDisplayLocation(team: { city: string; stateProv: string; country: string }): string {
  return [team.city, team.stateProv, team.country].filter((s) => s && s.trim()).join(', ');
}

export function sortThree(arr: number[]): number[] {
  return [...arr].sort((a, b) => a - b);
}

/** Opens a URL, showing an alert instead of an unhandled rejection if nothing can open it. */
export async function openLink(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open link', url);
  }
}

/** Parses a JSON route param, returning null instead of throwing on bad/missing input. */
export function parseRouteData<T>(raw: string | string[] | undefined): T | null {
  if (typeof raw !== 'string' || !raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
