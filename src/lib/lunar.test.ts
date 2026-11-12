import { describe, expect, it } from 'vitest';
import { addDays, parseISO, toISO } from './dates';
import {
  isLunarBirthday,
  isSolarBirthday,
  lunarBirthdayNames,
  solarBirthdayNames,
  solarToLunar,
} from './lunar';

describe('农历', () => {
  it('1998-02-26 是戊寅年正月三十，也是公历和农历生日', () => {
    const lunar = solarToLunar('1998-02-26');
    expect(lunar?.full).toBe('戊寅年正月三十');
    expect(solarBirthdayNames(2, 26)).toEqual(['cmy']);
    expect(lunarBirthdayNames(lunar)).toEqual(['cmy']);
    expect(isSolarBirthday(2, 26)).toBe(true);
    expect(isLunarBirthday(lunar)).toBe(true);
  });

  it('1998-09-14 不再单独标注生日', () => {
    const lunar = solarToLunar('1998-09-14');
    expect(lunar?.full).toContain('七月廿四');
    expect(solarBirthdayNames(9, 14)).toEqual([]);
    expect(lunarBirthdayNames(lunar)).toEqual([]);
  });

  it('春节当天显示正月', () => {
    expect(solarToLunar('2000-02-05')?.text).toBe('正月');
    expect(solarToLunar('2000-02-05')?.full).toBe('庚辰年正月初一');
    expect(solarToLunar('2026-02-17')?.text).toBe('正月');
    expect(solarToLunar('2027-02-06')?.text).toBe('正月');
  });

  it('初二之后显示日名', () => {
    expect(solarToLunar('2027-02-07')?.text).toBe('初二');
  });

  it('公历生日和农历生日在其他年份会分开', () => {
    const solar = solarToLunar('2027-02-26');
    expect(solarBirthdayNames(2, 26)).toEqual(['cmy']);
    expect(lunarBirthdayNames(solar)).toEqual([]);
    expect(isSolarBirthday(2, 26)).toBe(true);
    expect(isLunarBirthday(solar)).toBe(false);

    let cursor = parseISO('2027-01-01');
    const end = parseISO('2027-04-30');
    const hits: string[] = [];
    while (cursor <= end) {
      const iso = toISO(cursor);
      if (lunarBirthdayNames(solarToLunar(iso)).includes('cmy')) hits.push(iso);
      cursor = addDays(cursor, 1);
    }
    expect(hits).toHaveLength(1);
    expect(hits[0]).not.toBe('2027-02-26');
    expect(solarToLunar(hits[0])?.full).toContain('正月三十');
  });
});
