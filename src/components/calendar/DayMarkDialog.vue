<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { DayInfo } from '../../lib/schedule'

interface Props {
  /**
   * 正在编辑的日期。null 表示关闭，有值时用它初始化备注和开关
   */
  day: DayInfo | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /**
   * 取消，或点遮罩、按 Esc。不改已保存的数据
   */
  close: []
  /**
   * 保存草稿。note 已去掉首尾空格
   */
  save: [note: string, overtime: boolean, meeting: boolean, leave: boolean]
  /**
   * 备注和三个开关都清空，父组件删除这一天的记录
   */
  clear: []
}>()

const draftNote = ref('')
/**
 * 见面开关草稿
 */
const draftMeeting = ref(false)
/**
 * 加班开关草稿
 */
const draftOvertime = ref(false)
/**
 * 请假开关草稿
 */
const draftLeave = ref(false)
/**
 * 第一次点删除或清空保存时先变成确认，再点一次才真正清除
 */
const confirming = ref(false)
const noteInput = ref<HTMLTextAreaElement | null>(null)

watch(() => props.day, (day) => {
  if (!day) return
  draftNote.value = day.note
  draftMeeting.value = day.meeting
  draftOvertime.value = day.overtime
  draftLeave.value = day.leave
  confirming.value = false
  void nextTick(() => noteInput.value?.focus())
}, { immediate: true })

function close() {
  noteInput.value?.blur()
  emit('close')
}

/**
 * 草稿里是否打开了见面、加班或请假
 */
function draftFlags(): boolean {
  return draftMeeting.value || draftOvertime.value || draftLeave.value
}

/**
 * 没有备注也没有开关时，已有记录需要再确认一次才删除
 */
function onSave() {
  if (!props.day) return
  const note = draftNote.value.trim()
  const had = !!(props.day.note || props.day.meeting || props.day.overtime || props.day.leave)
  if (!note && !draftFlags() && had) {
    if (!confirming.value) {
      confirming.value = true
      return
    }
    emit('clear')
    return
  }
  if (!note && !draftFlags()) {
    close()
    return
  }
  emit('save', note, draftOvertime.value, draftMeeting.value, draftLeave.value)
}

function onDelete() {
  if (!confirming.value) {
    confirming.value = true
    return
  }
  emit('clear')
}

function onKeydown(event: KeyboardEvent) {
  if (props.day && event.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="day" class="dialog" @click.self="close">
    <div class="dialog__card" role="dialog" aria-modal="true">
      <div class="dialog__head">
        <span class="dialog__title">{{ day.iso }} · {{ day.weekdayLabel }}</span>
        <span class="dialog__meta">{{ day.isWork ? '上班日' : '休息日' }}</span>
      </div>
      <div class="dialog__row">
        <div>
          <span class="dialog__label">见面</span>
          <span class="dialog__hint">加上绿色角标，不改变当天底色</span>
        </div>
        <button
          class="dialog__switch dialog__switch--meeting"
          type="button"
          role="switch"
          :aria-checked="draftMeeting"
          aria-label="标注见面"
          @click="draftMeeting = !draftMeeting; confirming = false"
        ></button>
      </div>
      <div class="dialog__row">
        <div>
          <span class="dialog__label">加班</span>
          <span class="dialog__hint">加上橙色角标，不改变当天底色</span>
        </div>
        <button
          class="dialog__switch dialog__switch--overtime"
          type="button"
          role="switch"
          :aria-checked="draftOvertime"
          aria-label="标注加班"
          @click="draftOvertime = !draftOvertime; confirming = false"
        ></button>
      </div>
      <div class="dialog__row">
        <div>
          <span class="dialog__label">请假</span>
          <span class="dialog__hint">加上灰色角标，不改变当天底色</span>
        </div>
        <button
          class="dialog__switch dialog__switch--leave"
          type="button"
          role="switch"
          :aria-checked="draftLeave"
          aria-label="标注请假"
          @click="draftLeave = !draftLeave; confirming = false"
        ></button>
      </div>
      <textarea ref="noteInput" v-model="draftNote" class="dialog__input" rows="3" placeholder="例如：换班、调休、补充说明…"></textarea>
      <div class="dialog__actions">
        <button
          v-if="day.note || day.meeting || day.overtime || day.leave || confirming"
          class="dialog__btn dialog__btn--danger"
          :class="{ 'dialog__btn--confirm': confirming }"
          type="button"
          @click="onDelete"
        >
          {{ confirming ? '确认删除？' : '删除' }}
        </button>
        <button class="dialog__btn" type="button" @click="close">取消</button>
        <button class="dialog__btn dialog__btn--primary" type="button" @click="onSave">保存</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dialog {
  position: fixed;
  inset: 0;
  z-index: 9999;
  padding: 20px;
  background: rgba(15, 23, 42, .42);
  display: flex;
  align-items: center;
  justify-content: center;

  &__card {
    width: min(420px, 100%);
    background: #fff;
    border-radius: 16px;
    padding: 18px;
    box-shadow: 0 24px 60px -20px rgba(15, 23, 42, .5);
  }

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__title { font-size: 14px; font-weight: 700; }
  &__meta { font-size: 11.5px; color: #94a3b8; white-space: nowrap; }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
    padding: 8px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
  }

  &__label { display: block; font-size: 13px; font-weight: 700; }
  &__hint { display: block; margin-top: 2px; font-size: 11px; color: #94a3b8; }

  &__switch {
    position: relative;
    flex: 0 0 auto;
    width: 44px;
    height: 26px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: #e2e8f0;
    cursor: pointer;

    &::after {
      content: "";
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 2px rgba(15, 23, 42, .25);
      transition: transform .15s ease;
    }

    &[aria-checked='true']::after { transform: translateX(18px); }
    &--meeting[aria-checked='true'] { background: #16a34a; }
    &--overtime[aria-checked='true'] { background: #f97316; }
    &--leave[aria-checked='true'] { background: #64748b; }
  }

  &__input {
    width: 100%;
    min-height: 88px;
    resize: vertical;
    box-sizing: border-box;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 12px;
    font: inherit;
    font-size: 16px;
    color: #0f172a;
    outline: none;

    &:focus {
      border-color: var(--rc-brand);
      box-shadow: 0 0 0 3px rgba(30, 58, 138, .16);
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 12px;
  }

  &__btn {
    font: inherit;
    font-size: 12.5px;
    font-weight: 600;
    padding: 8px 14px;
    border-radius: 9px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #334155;
    cursor: pointer;

    &--primary {
      background: var(--rc-brand);
      border-color: var(--rc-brand);
      color: #fff;

      &:hover { background: #1d3f9e; }
    }

    &--danger {
      color: #b91c1c;
      border-color: #fecaca;
      background: #fef2f2;
    }

    &--confirm {
      background: #dc2626;
      border-color: #dc2626;
      color: #fff;
    }
  }
}
</style>
