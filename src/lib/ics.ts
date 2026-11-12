import { addDays, parseISO, toISO } from './dates';
import type { DayInfo } from './schedule';

export function buildICS(days: DayInfo[], workDays: number, restDays: number): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DSH//RestCalendar//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:上${workDays}休${restDays} · 休息日历`,
    'X-WR-TIMEZONE:Asia/Shanghai',
  ];
  const stamp = '20261109T010000Z';
  for (const day of days) {
    let summary: string | null = null;
    if (day.isRest) summary = day.restOnWeekend ? '休息（与周末重合）' : '休息';
    if (day.holiday) summary = `${summary ? summary : '上班'} · ${day.holiday.name}`;
    if (day.makeup) summary = `调休上班 · ${day.makeup}`;
    if (day.meeting) summary = `${summary ? summary + ' · ' : ''}见面`;
    if (day.overtime) summary = `${summary ? summary + ' · ' : ''}加班`;
    if (day.leave) summary = `${summary ? summary + ' · ' : ''}请假`;
    if (day.solarBirthday) summary = `${summary ? summary + ' · ' : ''}公历生日`;
    if (day.lunarBirthday) summary = `${summary ? summary + ' · ' : ''}农历生日`;
    if (!summary) continue;
    const start = day.iso.replace(/-/g, '');
    const end = toISO(addDays(parseISO(day.iso), 1)).replace(/-/g, '');
    lines.push(
      'BEGIN:VEVENT',
      `UID:day-${start}@rest-calendar`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${summary}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
}
