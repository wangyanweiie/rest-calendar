export interface Holiday {
  name: string
  festival: string
  type: 'statutory' | 'adjusted'
}

export interface HolidaySpan {
  festival: string
  start: string
  end: string
}

/**
 * 依据国务院办公厅 2026 / 2027 年节假日安排通知
 */
export const HOLIDAYS: Record<string, Holiday> = {
  '2026-09-25': { name: '中秋', festival: '中秋', type: 'statutory' },
  '2026-10-01': { name: '国庆', festival: '国庆', type: 'statutory' },
  '2026-10-02': { name: '国庆', festival: '国庆', type: 'statutory' },
  '2026-10-03': { name: '国庆', festival: '国庆', type: 'statutory' },
  '2026-10-05': { name: '假期', festival: '国庆', type: 'adjusted' },
  '2026-10-06': { name: '假期', festival: '国庆', type: 'adjusted' },
  '2026-10-07': { name: '假期', festival: '国庆', type: 'adjusted' },
  '2027-01-01': { name: '元旦', festival: '元旦', type: 'statutory' },
  '2027-02-05': { name: '除夕', festival: '春节', type: 'statutory' },
  '2027-02-06': { name: '春节', festival: '春节', type: 'statutory' },
  '2027-02-07': { name: '初二', festival: '春节', type: 'statutory' },
  '2027-02-08': { name: '初三', festival: '春节', type: 'statutory' },
  '2027-02-09': { name: '初四', festival: '春节', type: 'adjusted' },
  '2027-02-10': { name: '初五', festival: '春节', type: 'adjusted' },
  '2027-02-11': { name: '初六', festival: '春节', type: 'adjusted' },
  '2027-02-12': { name: '初七', festival: '春节', type: 'adjusted' },
  '2027-02-13': { name: '初八', festival: '春节', type: 'adjusted' },
  '2027-04-05': { name: '清明', festival: '清明', type: 'statutory' },
  '2027-05-01': { name: '劳动节', festival: '劳动节', type: 'statutory' },
  '2027-05-02': { name: '劳动节', festival: '劳动节', type: 'statutory' },
  '2027-05-03': { name: '假期', festival: '劳动节', type: 'adjusted' },
  '2027-05-04': { name: '假期', festival: '劳动节', type: 'adjusted' },
  '2027-05-05': { name: '假期', festival: '劳动节', type: 'adjusted' },
  '2027-06-09': { name: '端午', festival: '端午', type: 'statutory' },
  '2027-09-15': { name: '中秋', festival: '中秋', type: 'statutory' },
  '2027-10-01': { name: '国庆', festival: '国庆', type: 'statutory' },
  '2027-10-02': { name: '国庆', festival: '国庆', type: 'statutory' },
  '2027-10-03': { name: '国庆', festival: '国庆', type: 'statutory' },
  '2027-10-04': { name: '假期', festival: '国庆', type: 'adjusted' },
  '2027-10-05': { name: '假期', festival: '国庆', type: 'adjusted' },
  '2027-10-06': { name: '假期', festival: '国庆', type: 'adjusted' },
  '2027-10-07': { name: '假期', festival: '国庆', type: 'adjusted' },
}

export const HOLIDAY_SPANS: HolidaySpan[] = [
  { festival: '中秋', start: '2026-09-25', end: '2026-09-27' },
  { festival: '国庆', start: '2026-10-01', end: '2026-10-07' },
  { festival: '元旦', start: '2027-01-01', end: '2027-01-03' },
  { festival: '春节', start: '2027-02-05', end: '2027-02-13' },
  { festival: '清明', start: '2027-04-03', end: '2027-04-05' },
  { festival: '劳动节', start: '2027-05-01', end: '2027-05-05' },
  { festival: '端午', start: '2027-06-09', end: '2027-06-09' },
  { festival: '中秋', start: '2027-09-15', end: '2027-09-15' },
  { festival: '国庆', start: '2027-10-01', end: '2027-10-07' },
]

export const MAKEUP_DAYS: Record<string, string> = {
  '2026-09-20': '国庆调休',
  '2026-10-10': '国庆调休',
  '2027-01-31': '春节调休',
  '2027-02-14': '春节调休',
  '2027-05-08': '劳动节调休',
  '2027-09-26': '国庆调休',
  '2027-10-09': '国庆调休',
}
