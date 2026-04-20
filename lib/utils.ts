import { EventListing } from './models';
import { MONTH_NAMES } from './constants';

export function getDayNumber(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00Z');
  return Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
}

export function getNumericValue(dateStr: string): number {
  return parseInt(dateStr.substring(0, 4) + dateStr.substring(5, 7) + dateStr.substring(8, 10));
}

export function mergeSortByDate(arr: EventListing[]): void {
  if (arr.length <= 1) return;
  const mid = Math.floor(arr.length / 2);
  const L = arr.slice(0, mid);
  const R = arr.slice(mid);
  mergeSortByDate(L);
  mergeSortByDate(R);
  let i = 0, j = 0, k = 0;
  while (i < L.length && j < R.length) {
    const lVal = getNumericValue(L[i].dateStart);
    const rVal = getNumericValue(R[j].dateStart);
    if (lVal === rVal) {
      if (L[i].name.localeCompare(R[j].name) > 0) {
        arr[k++] = L[i++];
      } else {
        arr[k++] = R[j++];
      }
    } else if (lVal < rVal) {
      arr[k++] = L[i++];
    } else {
      arr[k++] = R[j++];
    }
  }
  while (i < L.length) arr[k++] = L[i++];
  while (j < R.length) arr[k++] = R[j++];
}

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

export function getWeekDateRange(seasonStart: string, weekIndex: number): string {
  const epochDay = getDayNumber(seasonStart);
  const endDay = epochDay + weekIndex * 7;
  const startDay = endDay - 6;
  const startDate = new Date(startDay * 24 * 60 * 60 * 1000);
  const endDate = new Date(endDay * 24 * 60 * 60 * 1000);
  const sm = MONTH_NAMES[startDate.getUTCMonth()];
  const em = MONTH_NAMES[endDate.getUTCMonth()];
  const sy = startDate.getUTCFullYear();
  const ey = endDate.getUTCFullYear();
  const sd = startDate.getUTCDate();
  const ed = endDate.getUTCDate();

  if (sy === ey && sm === em) {
    return `${sm} ${sd} - ${ed}, ${sy}`;
  } else if (sy === ey) {
    return `${sm} ${sd} - ${em} ${ed}, ${sy}`;
  } else {
    return `${sm} ${sd}, ${sy} - ${em} ${ed}, ${ey}`;
  }
}

export function parseTeamFullName(fullTeamName: string): { school: string | null; sponsors: string | null } {
  let school: string | null = null;
  let sponsors: string | null = null;

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
  if (team.city && team.stateProv) {
    return `${team.city}, ${team.stateProv}, ${team.country}`;
  }
  return team.country;
}

export function sortThree(arr: number[]): number[] {
  return [...arr].sort((a, b) => a - b);
}
