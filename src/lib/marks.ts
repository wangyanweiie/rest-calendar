import { isISODate } from './dates';

export const STORAGE_KEY = 'rest-calendar-notes-v1';

export interface DayMark {
  /**
   * 当天备注，没有时是空字符串
   */
  note: string;
  /**
   * 加班。打开后加橙色角标，不改变底色
   */
  overtime: boolean;
  /**
   * 见面。打开后加绿色角标，不改变底色
   */
  meeting: boolean;
  /**
   * 请假。打开后加灰色角标，不改变底色
   */
  leave: boolean;
}

export type MarkMap = Record<string, DayMark>;

interface StoredObject {
  n?: unknown;
  note?: unknown;
  ot?: unknown;
  overtime?: unknown;
  mt?: unknown;
  meeting?: unknown;
  lv?: unknown;
  leave?: unknown;
}

interface PackedMark {
  n?: string;
  ot?: 1;
  mt?: 1;
  lv?: 1;
}

/**
 * 没有备注、加班、见面、请假时的空记录
 */
export function emptyMark(): DayMark {
  return { note: '', overtime: false, meeting: false, leave: false };
}

/**
 * 这条记录是否值得保存
 */
export function hasMark(mark: DayMark): boolean {
  return !!(mark.note.trim() || mark.overtime || mark.meeting || mark.leave);
}

export function unpackMark(value: unknown): DayMark {
  if (!value) return emptyMark();
  if (typeof value === 'string') return { ...emptyMark(), note: value };
  if (typeof value === 'object') {
    const row = value as StoredObject;
    const note = String(row.n != null ? row.n : row.note || '');
    return {
      note,
      overtime: !!(row.ot || row.overtime),
      meeting: !!(row.mt || row.meeting),
      leave: !!(row.lv || row.leave),
    };
  }
  return emptyMark();
}

/**
 * 只有备注时仍写成字符串，和旧页面的 localStorage 兼容
 */
export function packMark(mark: DayMark): string | PackedMark | null {
  const note = mark.note.trim();
  if (!hasMark({ ...mark, note })) return null;
  if (!mark.overtime && !mark.meeting && !mark.leave) return note;
  const packed: PackedMark = {};
  if (note) packed.n = note;
  if (mark.overtime) packed.ot = 1;
  if (mark.meeting) packed.mt = 1;
  if (mark.leave) packed.lv = 1;
  return packed;
}

export function loadMarks(storage: Storage | null = browserStorage()): MarkMap {
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const data = raw ? (JSON.parse(raw) as unknown) : {};
    return normalizeMarks(data);
  } catch {
    return {};
  }
}

export function saveMarks(marks: MarkMap, storage: Storage | null = browserStorage()): void {
  if (!storage) return;
  const packed: Record<string, string | PackedMark> = {};
  for (const [iso, mark] of Object.entries(marks)) {
    const value = packMark(mark);
    if (value) packed[iso] = value;
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(packed));
}

export function exportMarks(marks: MarkMap): string {
  const clean: MarkMap = {};
  for (const [iso, mark] of Object.entries(marks)) {
    const note = mark.note.trim();
    if (!hasMark({ ...mark, note })) continue;
    clean[iso] = { note, overtime: mark.overtime, meeting: mark.meeting, leave: mark.leave };
  }
  return JSON.stringify(
    {
      version: 1,
      kind: 'rest-calendar-marks',
      marks: clean,
    },
    null,
    2,
  );
}

export function parseMarksImport(text: string): MarkMap {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('这不是 JSON 文件');
  }
  const raw = extractRawMarks(data);
  const marks = normalizeMarks(raw);
  if (!Object.keys(marks).length) throw new Error('文件里没有可导入的日期');
  return marks;
}

export function mergeMarks(current: MarkMap, incoming: MarkMap): MarkMap {
  return { ...current, ...incoming };
}

function extractRawMarks(data: unknown): unknown {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  const record = data as { marks?: unknown };
  if (record.marks && typeof record.marks === 'object') return record.marks;
  return data;
}

function normalizeMarks(data: unknown): MarkMap {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  const out: MarkMap = {};
  for (const [iso, value] of Object.entries(data)) {
    if (!isISODate(iso)) continue;
    const mark = unpackMark(value);
    mark.note = mark.note.trim();
    if (hasMark(mark)) out[iso] = mark;
  }
  return out;
}

function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
