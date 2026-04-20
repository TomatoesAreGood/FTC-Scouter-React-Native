export const YEARS = ['2019', '2020', '2021', '2022', '2023', '2024'];

export const SEASON_START_DATES: Record<string, string> = {
  '2019': '2019-09-07',
  '2020': '2020-09-12',
  '2021': '2021-09-18',
  '2022': '2022-09-10',
  '2023': '2023-09-09',
  '2024': '2024-09-07',
};

export const COUNTRIES = [
  'All', 'Thailand', 'USA', 'Australia', 'Belgium', 'Brazil', 'Canada',
  'China', 'Chinese Taipei', 'Cyprus', 'France', 'Greece', 'India',
  'Indonesia', 'Israel', 'Italy', 'Jamaica', 'Kazakhstan', 'Libya',
  'Malaysia', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 'Nigeria',
  'Qatar', 'Romania', 'Saudi Arabia', 'South Africa', 'South Korea',
  'United Kingdom', 'Vietnam', 'eSwatini', 'Egypt', 'Germany', 'Russia',
  'Spain', 'United Arab Emirates', 'Iceland',
];

export const EVENT_TYPES: Record<number, string> = {
  1: 'League Meet',
  2: 'Qualifier',
  3: 'League Tournament',
  4: 'Championship',
  5: 'Other',
  6: 'FIRST Championship',
  7: 'Super Qualifier',
  10: 'Off-Season',
};

export const EVENT_TYPE_OPTIONS = [
  { value: -1, label: 'All' },
  { value: 1, label: 'League Meet' },
  { value: 2, label: 'Qualifier' },
  { value: 3, label: 'League Tournament' },
  { value: 4, label: 'Championship' },
  { value: 6, label: 'FIRST Championship' },
  { value: 7, label: 'Super Qualifier' },
  { value: 10, label: 'Off-Season' },
  { value: 5, label: 'Other' },
];

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

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const APP_GREEN = '#90EE90';
export const APP_BLUE = '#ADD8E6';
export const API_BASE = 'https://ftc-api.firstinspires.org/v2.0';
