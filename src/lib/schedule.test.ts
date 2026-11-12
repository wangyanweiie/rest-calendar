import { describe, expect, it } from 'vitest'
import { getDayInfo, getSummary } from './schedule'

const base = {
  start: '2026-09-30',
  end: '2027-12-31',
  cycleStart: '2026-09-30',
  workDays: 2,
  restDays: 3,
}

describe('排班', () => {
  it('循环起点是上班第 1 天', () => {
    const day = getDayInfo('2026-09-30', base)
    expect(day.isWork).toBe(true)
    expect(day.cycleIndex).toBe(1)
  })

  it('第 3 天起进入休息，撞周末标红', () => {
    const rest = getDayInfo('2026-10-02', base)
    expect(rest.isRest).toBe(true)
    expect(rest.cycleIndex).toBe(3)
    const weekend = getDayInfo('2026-10-04', base)
    expect(weekend.restOnWeekend).toBe(true)
  })

  it('法定节假日和调休上班能读出来', () => {
    const holiday = getDayInfo('2026-10-01', base)
    expect(holiday.holiday?.name).toBe('国庆')
    expect(holiday.isStatutory).toBe(true)
    const makeup = getDayInfo('2026-10-10', base)
    expect(makeup.makeup).toBe('国庆调休')
  })

  it('备注和加班来自 marks，不改变排班', () => {
    const day = getDayInfo('2026-11-13', {
      ...base,
      marks: { '2026-11-13': { note: '换班', overtime: true } },
    })
    expect(day.note).toBe('换班')
    expect(day.overtime).toBe(true)
    expect(day.isRest).toBe(true)
  })

  it('统计包含标红天数', () => {
    const summary = getSummary({ ...base, end: '2026-10-31' })
    expect(summary.total).toBe(32)
    expect(summary.redOnWeekend).toBeGreaterThan(0)
    expect(summary.work + summary.rest).toBe(summary.total)
  })
})
