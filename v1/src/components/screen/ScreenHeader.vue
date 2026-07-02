<script setup lang="ts">
import { useClock } from '@/composables/useClock'

const defaultPrinciples = [
  '看全面',
  '看关键',
  '看深层',
  '看源头',
  '看趋势',
]

defineProps<{
  title?: string
  subtitle?: string
  principles?: string[]
}>()

const { dateStr, timeStr, weekStr } = useClock()
</script>

<template>
  <header class="screen-header">
    <div class="header-left">
      <div class="logo">
        <span class="logo-icon">GDUFE</span>
      </div>
      <div class="title-block">
        <h1 class="main-title">{{ title || '大数据与人工智能学院发展与治理驾驶舱' }}</h1>
        <p v-if="subtitle" class="sub-title">{{ subtitle }}</p>
      </div>
    </div>
    <div class="header-center">
      <span
        v-for="(item, i) in (principles || defaultPrinciples)"
        :key="i"
        class="principle-tag"
      >{{ item }}</span>
    </div>
    <div class="header-right">
      <span class="weather">广州 28°C 晴</span>
      <span class="datetime">{{ dateStr }} {{ weekStr }}</span>
      <span class="time">{{ timeStr }}</span>
    </div>
  </header>
</template>

<style scoped lang="scss">
.screen-header {
  height: $header-height;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: linear-gradient(180deg, rgba(0, 40, 80, 0.9) 0%, rgba(0, 20, 50, 0.4) 100%);
  border-bottom: 1px solid rgba(0, 212, 255, 0.25);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 2px;
    background: linear-gradient(90deg, transparent, $color-accent, transparent);
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 480px;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 1px solid rgba(0, 212, 255, 0.5);
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  color: $color-accent;
  letter-spacing: -0.5px;
}

.main-title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #fff 0%, $color-accent 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sub-title {
  font-size: 12px;
  color: $color-text-secondary;
  margin-top: 2px;
}

.header-center {
  display: flex;
  gap: 12px;
}

.principle-tag {
  padding: 4px 12px;
  font-size: 13px;
  color: $color-accent;
  border: 1px solid rgba(0, 212, 255, 0.35);
  border-radius: 2px;
  background: rgba(0, 212, 255, 0.08);
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 200px;
  font-size: 13px;
  color: $color-text-secondary;
}

.time {
  font-family: $font-display;
  font-size: 20px;
  color: $color-text-primary;
  letter-spacing: 1px;
}
</style>
