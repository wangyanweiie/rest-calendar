const DAY = 86400000

export const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']
export const WEEK_LABEL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function toISO(dt: Date): string {
  const m = dt.getUTCMonth() + 1
  const d = dt.getUTCDate()
  return `${dt.getUTCFullYear()}-${m < 10 ? '0' + m : m}-${d < 10 ? '0' + d : d}`
}

export function addDays(dt: Date, n: number): Date {
  return new Date(dt.getTime() + n * DAY)
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / DAY)
}

export function isWeekend(dt: Date): boolean {
  const w = dt.getUTCDay()
  return w === 0 || w === 6
}

export function todayISO(): string {
  const n = new Date()
  const m = n.getMonth() + 1
  const d = n.getDate()
  return `${n.getFullYear()}-${m < 10 ? '0' + m : m}-${d < 10 ? '0' + d : d}`
}

export function isISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}
