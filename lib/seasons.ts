/**
 * Season-specific ranking columns.
 *
 * The rankings endpoint returns sortOrder1..sortOrder6, but what each one means changes
 * with every game. These labels match the column headers on ftc-events.firstinspires.org
 * for each season, verified against the API values for the same event. When a new season
 * starts, add an entry here; until then the generic fallback is used.
 */

export interface RankColumn {
  /** Index into TeamPerformanceData.sortOrders (0 = sortOrder1). */
  index: number;
  /** Short label for the table. */
  label: string;
  /** Fixed decimals (averages use 2, totals and high scores 0). Omit to auto-format. */
  decimals?: number;
}

export interface SeasonRanking {
  /** Main ranking value, shown in its own column. */
  primary: RankColumn;
  /** Tiebreakers / stats, shown on the second line of each row. */
  secondary: RankColumn[];
}

const total = (index: number, label: string): RankColumn => ({ index, label, decimals: 0 });
const avg = (index: number, label: string): RankColumn => ({ index, label, decimals: 2 });

const RANKINGS: Record<number, SeasonRanking> = {
  // SKYSTONE: totals (ftc-events shows these as per-match averages; the API sends totals).
  2019: { primary: total(0, 'RP'), secondary: [total(1, 'TP'), total(2, 'High')] },
  // ULTIMATE GOAL / FREIGHT FRENZY: totals; high score is sortOrder6.
  2020: { primary: total(0, 'RP'), secondary: [total(1, 'TBP1'), total(2, 'TBP2'), total(5, 'High')] },
  2021: { primary: total(0, 'RP'), secondary: [total(1, 'TBP1'), total(2, 'TBP2'), total(5, 'High')] },
  // POWERPLAY / CENTERSTAGE: per-match averages.
  2022: { primary: avg(0, 'RP'), secondary: [avg(1, 'TBP1'), avg(2, 'TBP2'), total(3, 'High')] },
  2023: { primary: avg(0, 'RP'), secondary: [avg(1, 'TBP1'), avg(2, 'TBP2'), total(3, 'High')] },
  // INTO THE DEEP
  2024: { primary: avg(0, 'RS'), secondary: [avg(1, 'Auto'), avg(2, 'Ascent'), total(3, 'High')] },
  // DECODE
  2025: { primary: avg(0, 'RS'), secondary: [avg(1, 'Match'), avg(2, 'Base'), avg(3, 'Auto')] },
  // BIOBUZZ
  2026: { primary: avg(0, 'RP'), secondary: [avg(1, 'Match'), avg(2, 'Tips'), avg(3, 'Auto')] },
};

const FALLBACK: SeasonRanking = {
  primary: { index: 0, label: 'RS' },
  secondary: [{ index: 1, label: 'TB1' }, { index: 2, label: 'TB2' }, { index: 3, label: 'TB3' }],
};

export function getSeasonRanking(season: number): SeasonRanking {
  return RANKINGS[season] ?? FALLBACK;
}

function withThousands(s: string): string {
  const [int, frac] = s.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac !== undefined ? `${grouped}.${frac}` : grouped;
}

export function formatRankValue(n: number, column?: RankColumn): string {
  if (!isFinite(n)) return '–';
  if (column?.decimals !== undefined) return withThousands(n.toFixed(column.decimals));
  return withThousands(Number.isInteger(n) ? String(n) : n.toFixed(2));
}
