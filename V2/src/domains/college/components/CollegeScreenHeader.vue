<script setup lang="ts">
import { useClock } from '@/shared/composables/useClock'
import { useScope } from '@/shared/composables/useScope'

const principles = ['看全局', '抓重点', '强治理', '促发展', '提效能']
const { dateStr, timeStr } = useClock()
const { termLabel } = useScope()
</script>

<template>
  <header class="cockpit-header">
    <div class="cockpit-header__grid" aria-hidden="true" />
    <div class="cockpit-header__beam cockpit-header__beam--left" aria-hidden="true" />
    <div class="cockpit-header__beam cockpit-header__beam--right" aria-hidden="true" />
    <div class="cockpit-header__brand">
      <div class="school-emblem">
        <span class="school-emblem__halo" aria-hidden="true" />
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
      <div class="cockpit-header__title-halo" aria-hidden="true">
        <span />
        <span />
      </div>
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
        <span>{{ termLabel }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.school-emblem {
  isolation: isolate;
}

.school-emblem__halo {
  position: absolute;
  inset: -7px;
  z-index: -1;
  border: 1px solid rgba(0, 242, 255, 0.22);
  border-radius: 50%;
  background:
    conic-gradient(from 45deg, transparent, rgba(0, 242, 255, 0.22), transparent 38% 100%),
    linear-gradient(180deg, rgba(0, 242, 255, 0.12), rgba(9, 21, 52, 0.12));
  filter: drop-shadow(0 0 12px rgba(0, 242, 255, 0.28));
}

.school-emblem__svg {
  width: 78px;
  height: 78px;
  display: block;
}

.meta-card svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: #55dfff;
}
</style>
