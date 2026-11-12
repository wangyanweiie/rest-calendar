<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import RestCalendar from './components/RestCalendar.vue';
import { buildICS, downloadText } from './lib/ics';
import {
  STORAGE_KEY,
  exportMarks,
  loadMarks,
  mergeMarks,
  parseMarksImport,
  saveMarks,
  type MarkMap,
} from './lib/marks';
import { todayISO } from './lib/dates';
import { ANNUAL_BIRTHDAYS } from './lib/lunar';
import { getDays, getHolidayPeriods, getSummary, groupByCycle, type DayInfo } from './lib/schedule';

const baseUrl = import.meta.env.BASE_URL;
const DEFAULT_START = '2026-09-30';
const DEFAULT_END = '2027-12-31';
const CYCLE_START = '2026-09-30';

const start = ref(DEFAULT_START);
const end = ref(DEFAULT_END);
const marks = ref<MarkMap>({});
const marksReady = ref(false);
const selected = ref<DayInfo | null>(null);
const notice = ref('');
const noticeError = ref(false);
const calendarRef = ref<{
  goToMonth: (year: number, month: number) => void;
} | null>(null);

const schedule = computed(() => ({
  start: start.value,
  end: end.value,
  cycleStart: CYCLE_START,
  workDays: 2,
  restDays: 3,
  marks: marks.value,
}));
const summary = computed(() => getSummary(schedule.value));
const days = computed(() => getDays(schedule.value));
/**
 * 同一轮撞周末的休息日放在同一行
 */
const redRows = computed(() =>
  groupByCycle(
    days.value.filter((day) => day.restOnWeekend),
    schedule.value.cycleStart,
    schedule.value.workDays + schedule.value.restDays,
  ),
);
const periods = computed(() => getHolidayPeriods(start.value, end.value));
const makeups = computed(() => days.value.filter((day) => day.makeup));
/**
 * 每人一行，左列公历生日，右列农历生日
 */
const birthdayRows = computed(() =>
  ANNUAL_BIRTHDAYS.flatMap((person) => {
    const solar = days.value.filter((day) => day.solarBirthdays.includes(person.name));
    const lunar = days.value.filter((day) => day.lunarBirthdays.includes(person.name));
    const count = Math.max(solar.length, lunar.length);
    return Array.from({ length: count }, (_, index) => ({
      key: `${person.name}-${solar[index]?.iso ?? lunar[index]?.iso ?? index}`,
      name: person.name,
      solar: solar[index] ?? null,
      lunar: lunar[index] ?? null,
    }));
  }),
);
const stats = computed(() => [
  {
    k: '总天数',
    v: summary.value.total,
    n: `${start.value} → ${end.value}`,
    cls: '',
  },
  {
    k: '上班',
    v: summary.value.work,
    n: `其中周末上班 ${summary.value.weekendWork} 天`,
    cls: '',
  },
  {
    k: '休息',
    v: summary.value.rest,
    n: `占 ${summary.value.total ? Math.round((summary.value.rest / summary.value.total) * 100) : 0}%`,
    cls: '',
  },
  {
    k: '休息日与周末重合',
    v: summary.value.redOnWeekend,
    n: '红色高亮',
    cls: 'hot',
  },
  {
    k: '法定节假日',
    v: summary.value.statutoryDays,
    n: `官方假期共 ${summary.value.holidayPeriodDays} 天`,
    cls: 'gold',
  },
  { k: '调休上班', v: summary.value.makeupDays, n: '需正常上班', cls: '' },
]);

watch(marks, (value) => {
  if (marksReady.value) saveMarks(value);
});

function applyRange(nextStart: string, nextEnd: string) {
  if (nextStart && nextEnd && nextStart > nextEnd) nextEnd = nextStart;
  start.value = nextStart;
  end.value = nextEnd;
}

function onSave(iso: string, note: string, overtime: boolean, meeting: boolean, leave: boolean) {
  marks.value = { ...marks.value, [iso]: { note, overtime, meeting, leave } };
  refreshSelected(iso);
}

function onClear(iso: string) {
  const next = { ...marks.value };
  delete next[iso];
  marks.value = next;
  refreshSelected(iso);
}

function refreshSelected(iso: string) {
  if (selected.value?.iso === iso) {
    selected.value = days.value.find((day) => day.iso === iso) ?? selected.value;
  }
}

function selectDay(day: DayInfo) {
  selected.value = day;
}

function jump(year: number, month: number) {
  calendarRef.value?.goToMonth(year, month);
  document.querySelector('.cal')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function goToday() {
  const now = new Date();
  jump(now.getFullYear(), now.getMonth() + 1);
}

function exportIcs() {
  downloadText('上二休三休息日历.ics', buildICS(days.value, 2, 3), 'text/calendar;charset=utf-8');
}

function exportJson() {
  downloadText('rest-calendar-marks.json', exportMarks(marks.value), 'application/json');
  showNotice('已导出当前浏览器里的备注和加班');
}

async function importJson(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    const incoming = parseMarksImport(await file.text());
    marks.value = mergeMarks(marks.value, incoming);
    showNotice(`已导入 ${Object.keys(incoming).length} 天，同日期以文件为准`);
  } catch (error) {
    showNotice(error instanceof Error ? error.message : '导入失败', true);
  }
}

function showNotice(text: string, error = false) {
  notice.value = text;
  noticeError.value = error;
}

function onStorage(event: StorageEvent) {
  if (event.key === STORAGE_KEY) marks.value = loadMarks();
}

function md(iso: string) {
  const [, month, day] = iso.split('-');
  return `${Number(month)}/${Number(day)}`;
}

onMounted(() => {
  marks.value = loadMarks();
  marksReady.value = true;
  const query = new URLSearchParams(location.search);
  const queryStart = query.get('start');
  const queryEnd = query.get('end');
  if (queryStart && queryEnd) applyRange(queryStart, queryEnd);
  window.addEventListener('storage', onStorage);
});

onUnmounted(() => window.removeEventListener('storage', onStorage));
</script>

<template>
  <div class="page">
    <header class="top">
      <h1>上二休三 · 休息日历</h1>
      <!-- prettier-ignore -->
      <p class="sub">
        排班规则：每 5 天循环「上班 2 天 → 休息 3 天」。休息日若落在周六 / 周日
        <b style="color: #ef4444">标红</b>， 并额外标注<b style="color: #b45309">法定节假日</b>与<b>调休上班</b>日。 每一天显示农历。
        <b>长按或双击日期</b>可写备注，并用开关标注见面、加班或请假。这三个标记只加角标，不盖住休息日原来的颜色。记录保存在这台浏览器里。
      </p>
    </header>

    <div class="panel">
      <label class="field">
        起始
        <input v-model="start" type="date" @change="applyRange(start, end)" />
      </label>
      <label class="field">
        截止
        <input v-model="end" type="date" @change="applyRange(start, end)" />
      </label>
      <button class="btn" type="button" @click="applyRange(DEFAULT_START, DEFAULT_END)">
        重置
      </button>
      <button
        class="btn"
        type="button"
        title="截止到 2027-02-06（春节当天）"
        @click="applyRange(DEFAULT_START, '2027-02-06')"
      >
        只到春节
      </button>
      <button
        class="btn"
        type="button"
        title="只看 2027-01-01 ~ 2027-12-31"
        @click="
          applyRange('2027-01-01', '2027-12-31');
          jump(2027, 1);
        "
      >
        2027全年
      </button>
      <button class="btn" type="button" @click="goToday">回到今天</button>
      <div class="spacer"></div>
      <button class="btn" type="button" @click="exportJson">导出备注</button>
      <label class="btn file-btn">
        导入备注
        <input type="file" accept="application/json,.json" @change="importJson" />
      </label>
      <button class="btn primary" type="button" @click="exportIcs">导出 .ics</button>
    </div>
    <p v-if="notice" class="notice" :class="{ error: noticeError }">
      {{ notice }}
    </p>

    <RestCalendar
      ref="calendarRef"
      :start="start"
      :end="end"
      :cycle-start="CYCLE_START"
      :marks="marks"
      @select="selectDay"
      @save="onSave"
      @clear="onClear"
    />

    <div class="detail">
      <template v-if="selected">
        <span class="d-date">{{ selected.iso }}</span>
        <span class="d-week">{{ selected.weekdayLabel }}</span>
        <span v-if="selected.lunarFull" class="d-lunar">农历{{ selected.lunarFull }}</span>
        <span class="pill" :class="selected.isWork ? 'work' : 'rest'">
          {{ selected.isWork ? '上班' : '休息' }}
        </span>
        <span v-if="selected.restOnWeekend" class="pill red">休息日与周末重合 · 已标红</span>
        <span v-else-if="selected.weekend" class="pill">周末</span>
        <!-- prettier-ignore -->
        <span v-if="selected.holiday" class="pill gold">
          {{ selected.holiday.name }}{{ selected.isStatutory ? ' · 法定节假日' : ' · 假期（调休）' }}
        </span>
        <span v-if="selected.makeup" class="pill dark">{{ selected.makeup }} 上班</span>
        <span v-if="selected.solarBirthdays.length" class="pill solar">公历生日</span>
        <span v-if="selected.lunarBirthdays.length" class="pill lunar">农历生日</span>
        <span v-if="selected.meeting" class="pill meet">见面</span>
        <span v-if="selected.overtime" class="pill ot">加班</span>
        <span v-if="selected.leave" class="pill leave">请假</span>
        <span v-if="selected.note" class="pill note">备注：{{ selected.note }}</span>
        <span v-if="selected.iso === todayISO()" class="pill red">今天</span>
        <span class="d-note">
          循环第 {{ selected.cycleIndex }} / 5 天
          <template v-if="selected.holiday && selected.isWork">
            · 法定节假日当天仍按上二休三上班
          </template>
          <template v-if="selected.makeup && selected.isRest">
            · 官方调休上班，与上二休三休息日冲突
          </template>
        </span>
      </template>
      <span v-else class="detail-hint">点击任意日期查看当天详情</span>
    </div>

    <div class="cols">
      <div class="card">
        <h2>
          <span class="dot"></span>
          休息日与周末重合
        </h2>
        <div class="chips">
          <span v-if="!redRows.length" class="empty">范围内没有与周末重合的休息日</span>
          <div v-for="row in redRows" :key="row[0].iso" class="chips__row">
            <span v-for="day in row" :key="day.iso" class="date-chip">
              {{ day.iso }}
              <i>{{ day.weekdayLabel }}</i>
              <b>第 {{ day.restDayIndex }} 休息日</b>
            </span>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="hol-split">
          <section>
            <h2 class="gold">
              <span class="dot"></span>
              法定节假日
            </h2>
            <div class="hol-list">
              <button
                v-for="period in periods"
                :key="period.festival + period.start"
                class="hol-row"
                type="button"
                @click="jump(Number(period.start.slice(0, 4)), Number(period.start.slice(5, 7)))"
              >
                <span class="d">
                  {{
                    period.start === period.end
                      ? md(period.start)
                      : `${md(period.start)} ~ ${md(period.end)}`
                  }}
                </span>
                <span class="t">{{ period.festival }} · {{ period.days }} 天</span>
                <span class="s">法定 {{ period.statutory }} 天</span>
              </button>
              <span v-if="!periods.length" class="empty">范围内无法定节假日</span>
            </div>
          </section>
          <section>
            <h2>
              <span class="dot dot--makeup"></span>
              调休
            </h2>
            <div class="hol-list">
              <div v-for="day in makeups" :key="day.iso" class="hol-row makeup">
                <span class="d">{{ day.iso }}</span>
                <span class="t">{{ day.makeup }}上班</span>
                <span class="s">{{ day.weekdayLabel }}</span>
              </div>
              <span v-if="!makeups.length" class="empty">范围内无调休上班</span>
            </div>
          </section>
        </div>
      </div>
    </div>

    <div class="stats">
      <div v-for="item in stats" :key="item.k" class="stat" :class="item.cls">
        <div class="k">{{ item.k }}</div>
        <div class="v">{{ item.v }}</div>
        <div class="n">{{ item.n }}</div>
      </div>
    </div>

    <div v-if="birthdayRows.length" class="birthdays">
      <h2>每年单独标注</h2>
      <div v-for="row in birthdayRows" :key="row.key" class="birthdays__pair">
        <button
          v-if="row.solar"
          class="birthdays__row"
          type="button"
          @click="jump(row.solar.year, row.solar.month)"
        >
          <span class="d">{{ row.solar.iso }}</span>
          <span class="t">
            公历生日
            <template v-if="row.solar.lunarFull">· {{ row.solar.lunarFull }}</template>
          </span>
          <span class="s">{{ row.solar.weekdayLabel }}</span>
        </button>
        <span v-else class="birthdays__row birthdays__row--empty">范围内无公历生日</span>
        <button
          v-if="row.lunar"
          class="birthdays__row"
          type="button"
          @click="jump(row.lunar.year, row.lunar.month)"
        >
          <span class="d">{{ row.lunar.iso }}</span>
          <span class="t">
            农历生日
            <template v-if="row.lunar.lunarFull">· {{ row.lunar.lunarFull }}</template>
          </span>
          <span class="s">{{ row.lunar.weekdayLabel }}</span>
        </button>
        <span v-else class="birthdays__row birthdays__row--empty">范围内无农历生日</span>
      </div>
    </div>

    <section class="share">
      <img class="qr" :src="`${baseUrl}qrcode.png`" alt="扫码打开上二休三休息日历" />
      <div>
        <h2>手机 / 微信扫码打开</h2>
        <p>
          主地址：
          <a href="https://rest-calendar.netlify.app/">rest-calendar.netlify.app</a>
        </p>
        <p>
          备用：
          <a href="https://wangyanweiie.github.io/rest-calendar/">
            wangyanweiie.github.io/rest-calendar
          </a>
        </p>
        <p class="share-hint">
          微信里点右上角「···」→「在 Safari 中打开」，导出 .ics、翻页更完整；
          <br />
          Safari 中「分享 → 添加到主屏幕」，以后像 App 一样点开。
        </p>
      </div>
    </section>

    <footer>
      节假日依据：国务院办公厅《关于 2026 年部分节假日安排的通知》（国办发明电〔2025〕7 号）与《关于
      2027 年部分节假日安排的通知》（2026-11-05）—— 2026 国庆 10/1–10/7（10/10 上班）；2027 元旦
      1/1–1/3；春节 2/5–2/13（9 天，1/31、2/14 上班）；清明 4/3–4/5；劳动节 5/1–5/5（5/8 上班）；
      端午 6/9；中秋 9/15；国庆 10/1–10/7（9/26、10/9 上班）。法定节假日全年共 13 天。
    </footer>
  </div>
</template>
