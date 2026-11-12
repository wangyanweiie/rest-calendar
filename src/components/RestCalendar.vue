<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { WEEK_CN, todayISO } from "../lib/dates";
import type { MarkMap } from "../lib/marks";
import {
  canShift,
  clampMonth,
  getDayInfo,
  monthCells,
  monthOf,
  shiftMonth,
  type DayInfo,
  type MonthPoint,
} from "../lib/schedule";
import CalendarDay from "./calendar/CalendarDay.vue";
import CalendarHeader from "./calendar/CalendarHeader.vue";
import CalendarLegend from "./calendar/CalendarLegend.vue";
import DayMarkDialog from "./calendar/DayMarkDialog.vue";

interface Props {
  /**
   * 排班范围起点 YYYY-MM-DD
   */
  start: string;
  /**
   * 排班范围终点 YYYY-MM-DD
   */
  end: string;
  /**
   * 循环第 1 天。早于 start 时按同一循环往前倒推
   */
  cycleStart: string;
  /**
   * 每周期上班天数
   */
  workDays?: number;
  /**
   * 每周期休息天数
   */
  restDays?: number;
  /**
   * 一周从哪天开始。0 周日，1 周一
   */
  weekStart?: number;
  /**
   * 已保存的备注和加班，键是 YYYY-MM-DD
   */
  marks: MarkMap;
}

const props = withDefaults(defineProps<Props>(), {
  workDays: 2,
  restDays: 3,
  weekStart: 1,
});

const emit = defineEmits<{
  /**
   * 单击范围内的日期，父组件用来刷新详情条
   */
  select: [day: DayInfo];
  /**
   * 弹窗保存。父组件写入 marks
   */
  save: [iso: string, note: string, overtime: boolean, meeting: boolean, leave: boolean];
  /**
   * 弹窗确认删除。父组件去掉这一天的 marks
   */
  clear: [iso: string];
}>();

const view = ref<MonthPoint>(monthOf(props.start));
const compact = ref(false);
/**
 * 非 null 时打开备注 / 加班弹窗
 */
const activeIso = ref<string | null>(null);

const options = computed(() => ({
  start: props.start,
  end: props.end,
  cycleStart: props.cycleStart,
  workDays: props.workDays,
  restDays: props.restDays,
  marks: props.marks,
}));

const weekdays = computed(() =>
  Array.from({ length: 7 }, (_, index) => (props.weekStart + index) % 7),
);
const cells = computed(() =>
  monthCells(view.value.y, view.value.m, props.weekStart).map((iso, index) => {
    if (!iso)
      return {
        kind: "empty" as const,
        key: `empty-${view.value.y}-${view.value.m}-${index}`,
      };
    return {
      kind: "day" as const,
      key: iso,
      info: getDayInfo(iso, options.value),
    };
  }),
);
const prevDisabled = computed(
  () => !canShift(view.value, props.start, props.end, -1),
);
const nextDisabled = computed(
  () => !canShift(view.value, props.start, props.end, 1),
);
const activeDay = computed(() =>
  activeIso.value ? getDayInfo(activeIso.value, options.value) : null,
);
const today = todayISO();

watch(
  () => [props.start, props.end],
  () => {
    view.value = clampMonth(view.value, props.start, props.end);
  },
);

/**
 * 给父组件 ref 调用，把月历跳到指定年月，并限制在起止范围内
 */
function goToMonth(year: number, month: number) {
  view.value = clampMonth({ y: year, m: month }, props.start, props.end);
}

function shift(step: number) {
  if (step < 0 && prevDisabled.value) return;
  if (step > 0 && nextDisabled.value) return;
  view.value = shiftMonth(view.value, step);
}

function openDialog(iso: string) {
  const info = getDayInfo(iso, options.value);
  if (!info.inRange) return;
  activeIso.value = iso;
}

function closeDialog() {
  activeIso.value = null;
}

function onSave(note: string, overtime: boolean, meeting: boolean, leave: boolean) {
  const iso = activeIso.value;
  if (!iso) return;
  closeDialog();
  emit("save", iso, note, overtime, meeting, leave);
}

function onClear() {
  const iso = activeIso.value;
  if (!iso) return;
  closeDialog();
  emit("clear", iso);
}

function syncCompact() {
  compact.value = window.matchMedia("(max-width: 640px)").matches;
}

onMounted(() => {
  syncCompact();
  const initial = new URLSearchParams(location.search).get("m");
  if (initial && /^\d{4}-\d{2}$/.test(initial)) {
    const [year, month] = initial.split("-").map(Number);
    goToMonth(year, month);
  } else {
    view.value = clampMonth(monthOf(todayISO()), props.start, props.end);
  }
  window.addEventListener("resize", syncCompact);
});

onUnmounted(() => window.removeEventListener("resize", syncCompact));

defineExpose({ goToMonth });
</script>

<template>
  <section class="cal">
    <CalendarHeader
      :year="view.y"
      :month="view.m"
      :work-days="workDays"
      :rest-days="restDays"
      :start="start"
      :end="end"
      :prev-disabled="prevDisabled"
      :next-disabled="nextDisabled"
      @shift="shift"
    />

    <div class="cal__week">
      <span
        v-for="day in weekdays"
        :key="day"
        class="cal__weekday"
        :class="{ 'cal__weekday--end': day === 0 || day === 6 }"
      >
        周{{ WEEK_CN[day] }}
      </span>
    </div>

    <div class="cal__grid">
      <template v-for="cell in cells" :key="cell.key">
        <div
          v-if="cell.kind === 'empty'"
          class="cal__pad"
          aria-hidden="true"
        ></div>
        <CalendarDay
          v-else
          :info="cell.info"
          :today="today"
          :compact="compact"
          @select="emit('select', $event)"
          @edit="openDialog"
        />
      </template>
    </div>

    <CalendarLegend />
    <DayMarkDialog
      :day="activeDay"
      @close="closeDialog"
      @save="onSave"
      @clear="onClear"
    />
  </section>
</template>

<style lang="scss" scoped>
.cal {
  background: #fff;
  border: 1px solid var(--rc-line);
  border-radius: 20px;
  padding: 18px 18px 14px;
  box-shadow: 0 18px 40px -24px rgba(15, 23, 42, 0.35);
  color: var(--rc-ink);
  font-family:
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    system-ui,
    -apple-system,
    sans-serif;

  &__week,
  &__grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
  }

  &__week {
    margin-bottom: 8px;
  }

  &__weekday {
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    padding: 2px 0;
    letter-spacing: 0.08em;

    &--end {
      color: #f87171;
    }
  }

  &__pad {
    min-height: 88px;
    border: 1px dashed #eef2f7;
    border-radius: 12px;
    background: #f8fafc;
  }

  @media (max-width: 640px) {
    padding: 14px 10px 10px;
    border-radius: 16px;

    &__week,
    &__grid {
      gap: 4px;
    }

    &__pad {
      min-height: 64px;
      border-radius: 10px;
    }
  }
}
</style>
