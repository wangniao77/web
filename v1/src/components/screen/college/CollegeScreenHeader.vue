<script setup lang="ts">
import { useClock } from '@/composables/useClock'
import DashIcon from '@/components/DashIcon.vue'
import collegeLogo from '@/assets/college-logo.png'

const principles = ['看全局', '抓重点', '强治理', '促发展', '提效能']
const { dateStr, timeStr } = useClock()
</script>

<template>
  <header class="cockpit-header">
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
      <h1>大数据与人工智能学院发展与治理驾驶舱</h1>
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
        <span>22°C 多云</span>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.school-emblem__img {
  width: 64px;
  height: 64px;
  display: block;
  object-fit: contain;
}

.meta-card svg {
  width: 16px;
  height: 16px;
  color: #55dfff;
}
</style>
