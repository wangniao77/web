<script setup lang="ts">
import { useClock } from '@/shared/composables/useClock'

const principles = ['看全局', '抓重点', '强治理', '促发展', '提效能']
const { dateStr, timeStr } = useClock()
</script>

<template>
  <header class="cockpit-header">
    <div class="cockpit-header__brand">
      <div class="school-emblem">
        <svg viewBox="0 0 64 64" class="school-emblem__svg" aria-hidden="true">
          <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,242,255,0.35)" stroke-width="1.5" />
          <text x="32" y="38" text-anchor="middle" fill="#fff" font-size="16" font-weight="700">广财</text>
        </svg>
      </div>
      <div class="school-name">
        <span class="school-name__title">广东财经大学</span>
        <span class="school-name__school">大数据与人工智能学院</span>
        <span class="school-name__motto">厚德 励学 笃行 拓新</span>
      </div>
    </div>

    <div class="cockpit-header__title">
      <div class="cockpit-header__title-wings" aria-hidden="true" />
      <h1>大数据与人工智能学院发展与治理驾驶舱</h1>
      <nav class="cockpit-header__tabs">
        <span v-for="(tab, index) in principles" :key="tab">
          {{ tab }}<b v-if="index < principles.length - 1">|</b>
        </span>
      </nav>
    </div>

    <div class="cockpit-header__meta">
      <div class="meta-card">
        <svg aria-hidden="true"><use href="/icons.svg#icon-clock" /></svg>
        <span>{{ dateStr }}</span>
      </div>
      <div class="meta-card">
        <svg aria-hidden="true"><use href="/icons.svg#icon-clock" /></svg>
        <span>{{ timeStr }}</span>
      </div>
      <div class="meta-card">
        <svg aria-hidden="true"><use href="/icons.svg#icon-warning" /></svg>
        <span>22°C 多云</span>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.school-emblem__svg {
  width: 64px;
  height: 64px;
  display: block;
}

.meta-card svg {
  width: 16px;
  height: 16px;
  color: #55dfff;
}
</style>
