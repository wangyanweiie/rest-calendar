import { parseISO } from './dates';

/**
 * 1900–2100 年农历大小月与闰月，基准日是 1900-01-31（正月初一）
 */
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, 0x04ae0,
  0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0,
  0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0, 0x0ea50,
  0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, 0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0,
  0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0,
  0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260,
  0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558,
  0x0b540, 0x0b6a0, 0x195a6, 0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46,
  0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5,
  0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, 0x07954,
  0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, 0x05aa0, 0x076a3,
  0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2,
  0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, 0x14b63, 0x09370, 0x049f8, 0x04970,
  0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, 0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0,
  0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, 0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50,
  0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, 0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60,
  0x0a570, 0x054e4, 0x0d160, 0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0,
  0x0d150, 0x0f252, 0x0d520,
];

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const DAY_NAMES = [
  '初一',
  '初二',
  '初三',
  '初四',
  '初五',
  '初六',
  '初七',
  '初八',
  '初九',
  '初十',
  '十一',
  '十二',
  '十三',
  '十四',
  '十五',
  '十六',
  '十七',
  '十八',
  '十九',
  '二十',
  '廿一',
  '廿二',
  '廿三',
  '廿四',
  '廿五',
  '廿六',
  '廿七',
  '廿八',
  '廿九',
  '三十',
];

/**
 * 每年单独标注的生日。公历和农历分开，闰月不算
 */
export const ANNUAL_BIRTHDAYS = [
  { name: 'cmy', solarMonth: 2, solarDay: 26, lunarMonth: 1, lunarDay: 30 },
];

/**
 * 这一天过公历生日的名字
 */
export function solarBirthdayNames(month: number, day: number): string[] {
  return ANNUAL_BIRTHDAYS.filter((item) => item.solarMonth === month && item.solarDay === day).map(
    (item) => item.name,
  );
}

/**
 * 这一天过农历生日的名字，闰月不算
 */
export function lunarBirthdayNames(lunar: LunarDate | null): string[] {
  if (!lunar || lunar.leap) return [];
  return ANNUAL_BIRTHDAYS.filter(
    (item) => item.lunarMonth === lunar.month && item.lunarDay === lunar.day,
  ).map((item) => item.name);
}

/**
 * 是否有人在这一天过公历生日
 */
export function isSolarBirthday(month: number, day: number): boolean {
  return solarBirthdayNames(month, day).length > 0;
}

/**
 * 是否有人在这一天过农历生日
 */
export function isLunarBirthday(lunar: LunarDate | null): boolean {
  return lunarBirthdayNames(lunar).length > 0;
}

export interface LunarDate {
  /**
   * 农历年，春节前仍属上一年
   */
  year: number;
  /**
   * 农历月，1 是正月
   */
  month: number;
  /**
   * 农历日，1 是初一
   */
  day: number;
  /**
   * 这一天是否落在闰月
   */
  leap: boolean;
  /**
   * 干支年，例如戊寅
   */
  yearName: string;
  /**
   * 月份名，初一显示这个，例如正月、闰四月
   */
  monthName: string;
  /**
   * 日期名，例如初二、三十
   */
  dayName: string;
  /**
   * 格子里的短文案：初一用月名，其余用日名
   */
  text: string;
  /**
   * 完整农历，例如戊寅年正月三十
   */
  full: string;
}

/**
 * 该农历年的闰月月份，没有闰月时为 0
 */
function leapMonth(year: number): number {
  return LUNAR_INFO[year - 1900] & 0xf;
}

/**
 * 闰月天数，没有闰月时为 0
 */
function leapDays(year: number): number {
  if (!leapMonth(year)) return 0;
  return LUNAR_INFO[year - 1900] & 0x10000 ? 30 : 29;
}

/**
 * 非闰月的天数
 */
function monthDays(year: number, month: number): number {
  return LUNAR_INFO[year - 1900] & (0x10000 >> month) ? 30 : 29;
}

/**
 * 该农历年的总天数
 */
function lunarYearDays(year: number): number {
  let sum = 348;
  for (let mask = 0x8000; mask > 0x8; mask >>= 1) {
    if (LUNAR_INFO[year - 1900] & mask) sum += 1;
  }
  return sum + leapDays(year);
}

/**
 * 把公历日期换成农历；1900-01-31 之前或 2100 年之后返回 null
 */
export function solarToLunar(iso: string): LunarDate | null {
  const date = parseISO(iso);
  let offset = Math.round((date.getTime() - Date.UTC(1900, 0, 31)) / 86400000);
  if (offset < 0) return null;

  let year = 1900;
  let yearDays = 0;
  for (; year < 2101 && offset > 0; year++) {
    yearDays = lunarYearDays(year);
    offset -= yearDays;
  }
  if (offset < 0) {
    offset += yearDays;
    year -= 1;
  }
  if (year < 1900 || year > 2100) return null;

  const leap = leapMonth(year);
  let isLeap = false;
  let month = 1;
  let daysInMonth = 0;
  for (month = 1; month < 13 && offset > 0; month++) {
    if (leap > 0 && month === leap + 1 && !isLeap) {
      month -= 1;
      isLeap = true;
      daysInMonth = leapDays(year);
    } else {
      daysInMonth = monthDays(year, month);
    }
    if (isLeap && month === leap + 1) isLeap = false;
    offset -= daysInMonth;
  }
  if (offset === 0 && leap > 0 && month === leap + 1) {
    if (isLeap) isLeap = false;
    else {
      isLeap = true;
      month -= 1;
    }
  }
  if (offset < 0) {
    offset += daysInMonth;
    month -= 1;
  }

  const day = offset + 1;
  const yearName = STEMS[(year - 4) % 10] + BRANCHES[(year - 4) % 12];
  const monthName = `${isLeap ? '闰' : ''}${MONTHS[month - 1]}月`;
  const dayName = DAY_NAMES[day - 1];
  return {
    year,
    month,
    day,
    leap: isLeap,
    yearName,
    monthName,
    dayName,
    text: day === 1 ? monthName : dayName,
    full: `${yearName}年${monthName}${dayName}`,
  };
}
