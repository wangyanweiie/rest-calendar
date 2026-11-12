import { isISODate } from './dates'

export const STORAGE_KEY = 'rest-calendar-notes-v1'

export interface DayMark {
  note: string
  overtime: boolean
}

export type MarkMap = Record<string, DayMark>

interface StoredObject {
  n?: unknown
  note?: unknown
  ot?: unknown
  overtime?: unknown
}

export function unpackMark(value: unknown): DayMark {
  if (!value) return { note: '', overtime: false }
  if (typeof value === 'string') return { note: value, overtime: false }
  if (typeof value === 'object') {
    const row = value as StoredObject
    const note = String(row.n != null ? row.n : row.note || '')
    return { note, overtime: !!(row.ot || row.overtime) }
  }
  return { note: '', overtime: false }
}

/**
 * 只有备注时仍写成字符串，和旧页面的 localStorage 兼容
 */
export function packMark(mark: DayMark): string | { n: string; ot: 1 } | { ot: 1 } | null {
  const note = mark.note.trim()
  if (!note && !mark.overtime) return null
  if (!mark.overtime) return note
  return note ? { n: note, ot: 1 } : { ot: 1 }
}

export function loadMarks(storage: Storage | null = browserStorage()): MarkMap {
  if (!storage) return {}
  try {
    const raw = storage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) as unknown : {}
    return normalizeMarks(data)
  } catch {
    return {}
  }
}

export function saveMarks(marks: MarkMap, storage: Storage | null = browserStorage()): void {
  if (!storage) return
  const packed: Record<string, string | { n: string; ot: 1 } | { ot: 1 }> = {}
  for (const [iso, mark] of Object.entries(marks)) {
    const value = packMark(mark)
    if (value) packed[iso] = value
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(packed))
}

export function exportMarks(marks: MarkMap): string {
  const clean: MarkMap = {}
  for (const [iso, mark] of Object.entries(marks)) {
    const note = mark.note.trim()
    if (!note && !mark.overtime) continue
    clean[iso] = { note, overtime: mark.overtime }
  }
  return JSON.stringify({
    version: 1,
    kind: 'rest-calendar-marks',
    marks: clean,
  }, null, 2)
}

export function parseMarksImport(text: string): MarkMap {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('这不是 JSON 文件')
  }
  const raw = extractRawMarks(data)
  const marks = normalizeMarks(raw)
  if (!Object.keys(marks).length) throw new Error('文件里没有可导入的日期')
  return marks
}

export function mergeMarks(current: MarkMap, incoming: MarkMap): MarkMap {
  return { ...current, ...incoming }
}

function extractRawMarks(data: unknown): unknown {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data
  const record = data as { marks?: unknown }
  if (record.marks && typeof record.marks === 'object') return record.marks
  return data
}

function normalizeMarks(data: unknown): MarkMap {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  const out: MarkMap = {}
  for (const [iso, value] of Object.entries(data)) {
    if (!isISODate(iso)) continue
    const mark = unpackMark(value)
    mark.note = mark.note.trim()
    if (mark.note || mark.overtime) out[iso] = mark
  }
  return out
}

function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
