<script setup lang="ts">
import type { DayInfo } from '../../lib/schedule';

interface Props {
  /**
   * 这一天的排班、节假日、备注和加班
   */
  info: DayInfo;
  /**
   * 今天的日期，用来加描边
   */
  today: string;
  /**
   * 窄屏时备注只显示更少的字
   */
  compact: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  /**
   * 单击：让父组件展示当天详情
   */
  select: [info: DayInfo];
  /**
   * 长按、双击或右键：让父组件打开编辑弹窗
   */
  edit: [iso: string];
}>();

/**
 * 长按超过这个时间就打开编辑，并吞掉随后的单击
 */
const LONG_PRESS_MS = 550;
let pressTimer: number | null = null;
let suppressClick = false;

/**
 * 给读屏和 title 用的完整描述
 */
function labelOf(info: DayInfo): string {
  return [
    info.weekdayLabel,
    info.iso,
    info.inRange ? (info.isWork ? '上班' : '休息') : '超出范围',
    info.holiday ? info.holiday.name : '',
    info.makeup ? `${info.makeup} 上班` : '',
    info.restOnWeekend ? '与周末重合' : '',
    info.lunarFull ? `农历${info.lunarFull}` : '',
    info.solarBirthdays.length ? `${info.solarBirthdays.join('、')} 公历生日` : '',
    info.lunarBirthdays.length ? `${info.lunarBirthdays.join('、')} 农历生日` : '',
    info.meeting ? '见面' : '',
    info.overtime ? '加班' : '',
    info.leave ? '请假' : '',
    info.note ? `备注：${info.note}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

function clearPress() {
  if (pressTimer == null) return;
  window.clearTimeout(pressTimer);
  pressTimer = null;
}

/**
 * 按下后开始计时；鼠标右键不触发长按
 */
function onPointerDown(event: PointerEvent) {
  if (!props.info.inRange) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  clearPress();
  pressTimer = window.setTimeout(() => {
    pressTimer = null;
    suppressClick = true;
    emit('edit', props.info.iso);
  }, LONG_PRESS_MS);
}

function onClick() {
  if (suppressClick) {
    suppressClick = false;
    return;
  }
  if (!props.info.inRange) return;
  emit('select', props.info);
}

function onEdit() {
  if (!props.info.inRange) return;
  clearPress();
  emit('edit', props.info.iso);
}

/**
 * 格子里只露前几个字，完整备注在下方详情
 */
function notePreview(note: string): string {
  const limit = props.compact ? 2 : 4;
  if (note.length <= limit) return note;
  return `${note.slice(0, limit)}…`;
}

/**
 * 节假日名称和农历重复时，格子里改显示节日名
 */
function holidayLabel(info: DayInfo): string {
  if (!info.holiday) return '';
  if (info.holiday.name === info.lunarText) return info.holiday.festival;
  return info.holiday.name;
}
</script>

<template>
  <button
    class="day"
    :class="{
      'day--out': !info.inRange,
      'day--work': info.inRange && info.isWork,
      'day--rest': info.inRange && info.isRest,
      'day--weekend': info.inRange && info.restOnWeekend,
      'day--today': info.iso === today,
      'day--solar': info.solarBirthdays.length > 0,
      'day--lunar-birth': info.lunarBirthdays.length > 0,
    }"
    type="button"
    :aria-label="labelOf(info)"
    :title="labelOf(info)"
    @pointerdown="onPointerDown"
    @pointerup="clearPress"
    @pointerleave="clearPress"
    @pointercancel="clearPress"
    @contextmenu.prevent="onEdit"
    @dblclick.prevent="onEdit"
    @click="onClick"
  >
    <div class="day__top">
      <span class="day__date">
        {{ info.day }}
        <span
          v-if="info.lunarText"
          class="day__lunar"
          :class="{ 'day__lunar--month': info.lunarMonthStart }"
        >
          {{ info.lunarText }}
        </span>
      </span>
      <span
        v-if="
          (info.inRange &&
            (info.meeting || info.overtime || info.leave || info.makeup || info.holiday)) ||
          info.solarBirthdays.length ||
          info.lunarBirthdays.length
        "
        class="day__tags"
      >
        <span
          v-for="name in info.solarBirthdays"
          :key="`solar-${name}`"
          class="day__tag day__tag--solar"
        >
          {{ name }}
        </span>
        <span
          v-for="name in info.lunarBirthdays"
          :key="`lunar-${name}`"
          class="day__tag day__tag--lunar"
        >
          {{ name }}
        </span>
        <span v-if="info.inRange && info.meeting" class="day__tag day__tag--meeting">
          <span class="day__tag-full">见面</span>
          <span class="day__tag-short">见</span>
        </span>
        <span v-if="info.inRange && info.overtime" class="day__tag day__tag--overtime">
          <span class="day__tag-full">加班</span>
          <span class="day__tag-short">加</span>
        </span>
        <span v-if="info.inRange && info.leave" class="day__tag day__tag--leave">
          <span class="day__tag-full">请假</span>
          <span class="day__tag-short">请</span>
        </span>
        <span v-if="info.inRange && info.makeup" class="day__tag day__tag--makeup">调</span>
        <span v-else-if="info.inRange && info.holiday" class="day__tag day__tag--holiday">
          <span class="day__tag-full">{{ info.isStatutory ? '法定' : '假日' }}</span>
          <span class="day__tag-short">{{ info.isStatutory ? '节' : '假' }}</span>
        </span>
      </span>
    </div>
    <div v-if="info.inRange" class="day__bottom">
      <span class="day__state">{{ info.isWork ? '班' : '休' }}</span>
      <span v-if="info.note" class="day__note">{{ notePreview(info.note) }}</span>
      <span v-if="info.holiday" class="day__holiday">{{ holidayLabel(info) }}</span>
    </div>
  </button>
</template>

<style lang="scss" scoped>
.day {
  position: relative;
  min-height: 88px;
  min-width: 0;
  padding: 7px 8px 6px;
  border: 1px solid var(--rc-line);
  border-radius: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font: inherit;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  touch-action: manipulation;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px -10px rgba(15, 23, 42, 0.45);
  }
  &:focus-visible {
    outline: 2px solid var(--rc-brand);
    outline-offset: 2px;
  }

  &__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 4px;
    min-width: 0;
  }

  &__date {
    display: flex;
    flex-direction: column;
    gap: 1px;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  &__lunar {
    font-size: 10px;
    font-weight: 600;
    line-height: 1.15;
    color: #94a3b8;

    &--month {
      color: #0f766e;
    }
  }

  &__tags {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 3px;
    min-width: 0;
  }

  &__tag {
    font-size: 10px;
    font-weight: 700;
    line-height: 1;
    padding: 3px 5px;
    border-radius: 6px;
    letter-spacing: 0.04em;
    white-space: nowrap;

    &--meeting {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
    }
    &--overtime {
      background: #4c1d95;
      color: #fff;
      border: 1px solid #4c1d95;
    }
    &--leave {
      background: #f3f4f6;
      color: #4b5563;
      border: 1px solid #d1d5db;
    }
    &--holiday {
      background: var(--rc-gold-soft);
      color: var(--rc-gold);
      border: 1px solid #fcd34d;
    }
    &--makeup {
      background: #1e293b;
      color: #fff;
    }
    &--solar {
      background: #fdf2f8;
      color: #be185d;
      border: 1px solid #f9a8d4;
    }
    &--lunar {
      background: #eef2ff;
      color: #3730a3;
      border: 1px solid #c7d2fe;
    }
  }

  &__tag-short {
    display: none;
  }

  &__bottom {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    min-width: 0;
  }

  &__state {
    font-size: 10px;
    font-weight: 700;
    line-height: 1;
    padding: 3px 6px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #64748b;
    white-space: nowrap;
  }

  &__note {
    flex: 1 1 auto;
    min-width: 0;
    margin-left: 4px;
    font-size: 9.5px;
    line-height: 1.25;
    font-weight: 700;
    text-align: left;
    color: #15803d;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__holiday {
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    color: var(--rc-gold);
  }

  &--work &__date {
    color: #475569;
  }

  &--rest {
    background: var(--rc-rest);
    border-color: #cfdffb;

    .day__date {
      color: var(--rc-rest-text);
    }
    .day__state {
      background: #dbeafe;
      color: #1d4ed8;
    }
  }

  &--weekend {
    background: linear-gradient(160deg, #f43f5e 0%, #ef4444 55%, #dc2626 100%);
    border-color: #dc2626;
    box-shadow: 0 10px 20px -14px rgba(220, 38, 38, 0.9);

    .day__date,
    .day__lunar,
    .day__holiday,
    .day__note {
      color: #fff;
    }
    .day__state {
      background: rgba(255, 255, 255, 0.92);
      color: #b91c1c;
    }
    .day__tag--holiday {
      background: #fff7ed;
      color: #b91c1c;
      border-color: #fecaca;
    }
  }

  &--today {
    outline: 2px solid var(--rc-brand);
    outline-offset: -2px;
  }

  &--out {
    background: #f8fafc;
    border-style: dashed;
    border-color: #eef2f7;
    cursor: default;

    &:hover {
      transform: none;
      box-shadow: none;
    }
    .day__date,
    .day__lunar {
      color: #cbd5e1;
    }
  }

  @media (max-width: 640px) {
    min-height: 64px;
    padding: 5px;
    border-radius: 10px;

    .day__date {
      font-size: 13px;
    }
    .day__lunar {
      font-size: 8px;
    }
    .day__tags {
      gap: 2px;
    }
    .day__tag {
      font-size: 8px;
      padding: 1px 3px;
      border-radius: 4px;
      letter-spacing: 0;
    }
    .day__state {
      display: none;
    }
    .day__holiday,
    .day__note {
      font-size: 8px;
    }
    .day__tag-full {
      display: none;
    }
    .day__tag-short {
      display: inline;
    }
  }
}
</style>
