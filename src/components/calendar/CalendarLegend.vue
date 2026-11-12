<script setup lang="ts">
/**
 * 图例只说明颜色，不接收数据、不向父组件发事件
 */
const items = [
  { name: 'work', label: '上班' },
  { name: 'rest', label: '休息（工作日）' },
  { name: 'weekend', label: '休息日与周末重合（标红）' },
  { name: 'holiday', label: '法定节假日' },
  { name: 'makeup', label: '调休上班' },
  { name: 'overtime', label: '加班' },
  { name: 'note', label: '有备注' },
]
</script>

<template>
  <ul class="legend">
    <li v-for="item in items" :key="item.name" class="legend__item">
      <span class="legend__swatch" :class="`legend__swatch--${item.name}`"></span>
      {{ item.label }}
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: 14px 0 0;
  padding: 12px 0 0;
  border-top: 1px dashed var(--rc-line);
  list-style: none;

  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #64748b;
  }

  &__swatch {
    width: 14px;
    height: 14px;
    border-radius: 4px;
    border: 1px solid var(--rc-line);

    &--work { background: #fff; }
    &--rest { background: var(--rc-rest); border-color: #cfdffb; }
    &--weekend { background: linear-gradient(160deg, #f43f5e, #dc2626); border-color: #dc2626; }
    &--holiday { background: var(--rc-gold-soft); border-color: #fcd34d; }
    &--makeup { background: #1e293b; border-color: #1e293b; }
    &--overtime { background: linear-gradient(160deg, #fb923c, #ea580c); border-color: #c2410c; }
    &--note { background: #ecfdf5; border-color: #22c55e; }
  }
}
</style>
