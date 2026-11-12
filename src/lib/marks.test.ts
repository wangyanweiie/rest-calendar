import { describe, expect, it } from 'vitest';
import {
  exportMarks,
  loadMarks,
  mergeMarks,
  parseMarksImport,
  saveMarks,
  type MarkMap,
} from './marks';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => data.delete(key),
    setItem: (key, value) => data.set(key, value),
  };
}

describe('备注与加班存储', () => {
  it('兼容旧的字符串备注，加班写成对象', () => {
    const storage = memoryStorage();
    const marks: MarkMap = {
      '2026-11-12': { note: '调休', overtime: false, meeting: false, leave: false },
      '2026-11-13': { note: '换班', overtime: true, meeting: false, leave: false },
      '2026-11-14': { note: '', overtime: true, meeting: false, leave: false },
      '2026-11-15': { note: '', overtime: false, meeting: true, leave: false },
      '2026-11-16': { note: '回家', overtime: false, meeting: false, leave: true },
    };
    saveMarks(marks, storage);
    const raw = JSON.parse(storage.getItem('rest-calendar-notes-v1') || '{}');
    expect(raw['2026-11-12']).toBe('调休');
    expect(raw['2026-11-13']).toEqual({ n: '换班', ot: 1 });
    expect(raw['2026-11-14']).toEqual({ ot: 1 });
    expect(raw['2026-11-15']).toEqual({ mt: 1 });
    expect(raw['2026-11-16']).toEqual({ n: '回家', lv: 1 });
    expect(loadMarks(storage)).toEqual(marks);
  });

  it('能读回旧 localStorage，并导入合并', () => {
    const storage = memoryStorage();
    storage.setItem(
      'rest-calendar-notes-v1',
      JSON.stringify({
        '2026-11-01': '旧备注',
        '2026-11-02': { n: '已加班', ot: 1 },
      }),
    );
    const current = loadMarks(storage);
    expect(current['2026-11-01']).toEqual({
      note: '旧备注',
      overtime: false,
      meeting: false,
      leave: false,
    });
    const incoming = parseMarksImport(
      exportMarks({
        '2026-11-02': { note: '覆盖', overtime: true, meeting: true, leave: false },
        '2026-12-01': { note: '', overtime: true, meeting: false, leave: false },
      }),
    );
    const merged = mergeMarks(current, incoming);
    expect(merged['2026-11-01'].note).toBe('旧备注');
    expect(merged['2026-11-02'].note).toBe('覆盖');
    expect(merged['2026-12-01'].overtime).toBe(true);
    expect(merged['2026-11-02'].meeting).toBe(true);
  });

  it('拒绝空文件和坏 JSON', () => {
    expect(() => parseMarksImport('{')).toThrow('这不是 JSON 文件');
    expect(() => parseMarksImport('{"marks":{}}')).toThrow('文件里没有可导入的日期');
  });
});
