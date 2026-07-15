<script setup lang="ts">
import { useClock } from '@/composables/useClock'
import { useScope } from '@/composables/useScope'
import DashIcon from '@/components/college/DashIcon.vue'
import collegeLogo from '@/assets/college-logo.png'

const principles = ['掌态势', '精施策', '拓新局']
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
        <img :src="collegeLogo" class="school-emblem__img" alt="广东财经大学校徽" />
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
      <h1>数智洞察视界</h1>
      <nav class="cockpit-header__tabs">
        <span v-for="(tab, index) in principles" :key="tab">
          {{ tab }}<b v-if="index < principles.length - 1">|</b>
        </span>
      </nav>
    </div>

    <div class="cockpit-header__meta">
      <div class="meta-card">
        <DashIcon kind="calendar" :size="16" />
        <span>{{ dateStr }}</span>
      </div>
      <div class="meta-card">
        <DashIcon kind="clock" :size="16" />
        <span>{{ timeStr }}</span>
      </div>
      <div class="meta-card">
        <DashIcon kind="status" :size="16" />
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

.school-emblem__img {
  width: 64px;
  height: 64px;
  display: block;
  object-fit: contain;
}

.meta-card svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: #55dfff;
}
</style>
