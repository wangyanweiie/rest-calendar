<script setup lang="ts">
interface Props {
  /**
   * 当前显示的年份
   */
  year: number
  /**
   * 当前显示的月份，1–12
   */
  month: number
  /**
   * 每周期上班天数，用于副标题
   */
  workDays: number
  /**
   * 每周期休息天数，用于副标题
   */
  restDays: number
  /**
   * 排班范围起点 YYYY-MM-DD
   */
  start: string
  /**
   * 排班范围终点 YYYY-MM-DD
   */
  end: string
  /**
   * 已经是范围内第一个月，不能再往前
   */
  prevDisabled: boolean
  /**
   * 已经是范围内最后一个月，不能再往后
   */
  nextDisabled: boolean
}

defineProps<Props>()

/**
 * 翻月。step 为 -1 上个月，1 下个月
 */
const emit = defineEmits<{
  shift: [step: number]
}>()
</script>

<template>
  <header class="header">
    <div class="header__title">
      {{ year }} 年 {{ month }} 月
      <small>上{{ workDays }}休{{ restDays }} · {{ start }} → {{ end }}</small>
    </div>
    <div class="header__nav">
      <button class="header__btn" type="button" aria-label="上个月" :disabled="prevDisabled" @click="emit('shift', -1)">‹</button>
      <button class="header__btn" type="button" aria-label="下个月" :disabled="nextDisabled" @click="emit('shift', 1)">›</button>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  &__title {
    font-size: 17px;
    font-weight: 700;
    letter-spacing: .01em;

    small {
      display: block;
      margin-top: 3px;
      font-size: 11px;
      font-weight: 500;
      color: var(--rc-muted);
    }
  }

  &__nav {
    display: flex;
    gap: 8px;
  }

  &__btn {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid var(--rc-line);
    background: #fff;
    color: #475569;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;

    &:hover:not(:disabled) {
      background: #f1f5f9;
      color: var(--rc-brand);
      border-color: #cbd5e1;
    }

    &:disabled {
      opacity: .3;
      cursor: not-allowed;
    }
  }

  @media (max-width: 640px) {
    &__title { font-size: 15px; }
  }
}
</style>
