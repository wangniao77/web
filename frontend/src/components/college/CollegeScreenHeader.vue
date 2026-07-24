<script setup lang="ts">
import { ref } from 'vue'
import { useClock } from '@/composables/useClock'
import { useScope } from '@/composables/useScope'
import { exportActivePage, hasPageExport } from '@/composables/usePageExport'
import { collectDomTables } from '@/utils/collectDomTables'
import { downloadExcel, stampFilename } from '@/utils/exportExcel'
import DashIcon from '@/components/college/DashIcon.vue'
import collegeLogo from '@/assets/college-logo.png'

const principles = ['看全局', '抓重点', '强治理', '促发展', '提效能']
const { dateStr, timeStr } = useClock()
const { termLabel } = useScope()
const exporting = ref(false)

async function exportPageExcel() {
  if (exporting.value) return
  exporting.value = true
  try {
    if (hasPageExport()) {
      await exportActivePage()
      return
    }
    const sheets = collectDomTables(document)
    if (!sheets.length) {
      throw new Error('当前页暂无可导出的表格数据，请进入明细页后再导出')
    }
    downloadExcel(stampFilename('学院驾驶舱'), sheets)
  } catch (e) {
    window.alert(e instanceof Error ? e.message : '导出失败')
  } finally {
    exporting.value = false
  }
}
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
      <h1>大数据与人工智能学院发展与治理驾驶舱</h1>
      <nav class="cockpit-header__tabs">
        <span v-for="(tab, index) in principles" :key="tab">
          {{ tab }}<b v-if="index < principles.length - 1">|</b>
        </span>
      </nav>
    </div>

    <div class="cockpit-header__meta">
      <button
        type="button"
        class="meta-card meta-card--btn"
        :disabled="exporting"
        title="导出当前页数据为 Excel"
        @click="exportPageExcel"
      >
        <DashIcon kind="status" :size="16" />
        <span>{{ exporting ? '导出中…' : '导出Excel' }}</span>
      </button>
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

.meta-card--btn {
  cursor: pointer;
  border: 1px solid rgba(90, 190, 255, 0.45);
  background: linear-gradient(180deg, rgba(0, 120, 190, 0.28), rgba(4, 18, 48, 0.58));
  color: #b8f0ff;
  font: inherit;

  &:hover:not(:disabled) {
    border-color: rgba(120, 230, 255, 0.8);
    color: #ffffff;
  }

  &:disabled {
    opacity: 0.65;
    cursor: wait;
  }
}
</style>
