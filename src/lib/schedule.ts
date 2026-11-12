import { HOLIDAYS, HOLIDAY_SPANS, MAKEUP_DAYS, type Holiday, type HolidaySpan } from '../data/holidays'
import { WEEK_LABEL, addDays, diffDays, isWeekend, parseISO, toISO } from './dates'
import type { MarkMap } from './marks'

export interface ScheduleOptions {
  start: string
  end: string
  cycleStart: string
  workDays: number
  restDays: number
  marks?: MarkMap
  showHolidays?: boolean
}

export interface DayInfo {
  iso: string
  year: number
  month: number
  day: number
  weekday: number
  weekdayLabel: string
  weekend: boolean
  cycle: 'work' | 'rest'
  cycleIndex: number
  isWork: boolean
  isRest: boolean
  restOnWeekend: boolean
  holiday: Holiday | null
  isStatutory: boolean
  makeup: string | null
  note: string
  overtime: boolean
  inRange: boolean
}

export interface Summary {
  total: number
  work: number
  rest: number
  redOnWeekend: number
  weekendWork: number
  statutoryDays: number
  holidayDays: number
  holidayPeriodDays: number
  makeupDays: number
  redDates: string[]
}

export interface HolidayPeriod {
  festival: string
  start: string
  end: string
  days: number
  statutory: number
}

export function getDayInfo(iso: string, options: ScheduleOptions): DayInfo {
  const dt = parseISO(iso)
  const period = options.workDays + options.restDays
  const pos = ((diffDays(dt, parseISO(options.cycleStart)) % period) + period) % period
  const cycle = pos < options.workDays ? 'work' : 'rest'
  const weekend = isWeekend(dt)
  const show = options.showHolidays !== false
  const holiday = (show && HOLIDAYS[iso]) || null
  const makeup = (show && MAKEUP_DAYS[iso]) || null
  const mark = options.marks?.[iso]
  const startDt = parseISO(options.start)
  const endDt = parseISO(options.end)
  return {
    iso,
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
    weekday: dt.getUTCDay(),
    weekdayLabel: WEEK_LABEL[dt.getUTCDay()],
    weekend,
    cycle,
    cycleIndex: pos + 1,
    isWork: cycle === 'work',
    isRest: cycle === 'rest',
    restOnWeekend: cycle === 'rest' && weekend,
    holiday,
    isStatutory: !!holiday && holiday.type === 'statutory',
    makeup,
    note: mark?.note ?? '',
    overtime: !!mark?.overtime,
    inRange: dt >= startDt && dt <= endDt,
  }
}

export function getDays(options: ScheduleOptions): DayInfo[] {
  const out: DayInfo[] = []
  let cursor = parseISO(options.start)
  const endDt = parseISO(options.end)
  let guard = 0
  while (cursor <= endDt && guard++ < 4000) {
    out.push(getDayInfo(toISO(cursor), options))
    cursor = addDays(cursor, 1)
  }
  return out
}

export function getHolidayPeriods(start: string, end: string, spans: HolidaySpan[] = HOLIDAY_SPANS): HolidayPeriod[] {
  const rangeStart = parseISO(start)
  const rangeEnd = parseISO(end)
  const out: HolidayPeriod[] = []
  for (const span of spans) {
    const a = parseISO(span.start)
    const b = parseISO(span.end)
    const cs = a < rangeStart ? rangeStart : a
    const ce = b > rangeEnd ? rangeEnd : b
    if (ce < cs) continue
    let days = 0
    let statutory = 0
    let cursor = cs
    while (cursor <= ce) {
      days++
      const holiday = HOLIDAYS[toISO(cursor)]
      if (holiday?.type === 'statutory') statutory++
      cursor = addDays(cursor, 1)
    }
    out.push({
      festival: span.festival,
      start: toISO(cs),
      end: toISO(ce),
      days,
      statutory,
    })
  }
  return out
}

export function getSummary(options: ScheduleOptions): Summary {
  const days = getDays(options)
  const summary: Summary = {
    total: days.length,
    work: 0,
    rest: 0,
    redOnWeekend: 0,
    weekendWork: 0,
    statutoryDays: 0,
    holidayDays: 0,
    holidayPeriodDays: 0,
    makeupDays: 0,
    redDates: [],
  }
  for (const day of days) {
    if (day.isWork) {
      summary.work++
      if (day.weekend) summary.weekendWork++
    } else {
      summary.rest++
    }
    if (day.restOnWeekend) {
      summary.redOnWeekend++
      summary.redDates.push(day.iso)
    }
    if (day.isStatutory) summary.statutoryDays++
    if (day.holiday) summary.holidayDays++
    if (day.makeup) summary.makeupDays++
  }
  summary.holidayPeriodDays = getHolidayPeriods(options.start, options.end).reduce((n, item) => n + item.days, 0)
  return summary
}

export interface MonthPoint {
  y: number
  m: number
}

export function monthOf(iso: string): MonthPoint {
  const dt = parseISO(iso)
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1 }
}

export function clampMonth(current: MonthPoint, start: string, end: string): MonthPoint {
  const first = monthOf(start)
  const last = monthOf(end)
  const before = current.y < first.y || (current.y === first.y && current.m < first.m)
  const after = current.y > last.y || (current.y === last.y && current.m > last.m)
  if (before) return first
  if (after) return last
  return current
}

export function shiftMonth(current: MonthPoint, step: number): MonthPoint {
  let m = current.m + step
  let y = current.y
  if (m < 1) {
    m = 12
    y--
  }
  if (m > 12) {
    m = 1
    y++
  }
  return { y, m }
}

export function monthCells(year: number, month: number, weekStart = 1): Array<string | null> {
  const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() - weekStart + 7) % 7
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: Array<string | null> = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(toISO(new Date(Date.UTC(year, month - 1, day))))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function canShift(current: MonthPoint, start: string, end: string, step: number): boolean {
  const next = shiftMonth(current, step)
  const clamped = clampMonth(next, start, end)
  return clamped.y === next.y && clamped.m === next.m
}
