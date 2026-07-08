<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useClock } from '@/composables/useClock'
import { useFilterStore } from '@/stores/filter'
import { useUniversityDashboardStore } from '@/stores/universityDashboard'

const { dateStr, timeStr, weekStr } = useClock()
const filterStore = useFilterStore()
const dashboardStore = useUniversityDashboardStore()
const { schoolScope } = storeToRefs(filterStore)

const meta = computed(() => dashboardStore.meta)

const scopeLabel = computed(() => {
  const map = { all: '全校', guangzhou: '广州校区', foshan: '佛山校区' } as const
  return map[schoolScope.value]
})
</script>

<template>
  <div class="uni-header-wrap">
    <header class="uni-header">
      <div class="uni-header__left">
        <div class="uni-header__logo"><span>广财</span></div>
        <div>
          <div class="uni-header__school">广东财经大学</div>
          <div class="uni-header__sub">全校治理数据中心 · {{ scopeLabel }}</div>
        </div>
      </div>

      <div class="uni-header__center">
        <div class="uni-title">
          <span class="uni-title__wing uni-title__wing--l" aria-hidden="true" />
          <h1 class="uni-title__text">学校高质量发展总览驾驶舱</h1>
          <span class="uni-title__wing uni-title__wing--r" aria-hidden="true" />
        </div>
      </div>

      <div class="uni-header__right">
        <div class="uni-header__meta">
          <span>{{ dateStr }} {{ weekStr }}</span>
          <span class="uni-header__time">{{ timeStr }}</span>
          <span>更新 {{ meta?.dataUpdatedAt ?? '实时' }}</span>
        </div>
      </div>
    </header>
  </div>
</template>

<style scoped lang="scss">
.uni-header-wrap { position: relative; z-index: 5; flex-shrink: 0; }
.uni-header {
  height: var(--uni-header-height);
  display: grid;
  grid-template-columns: 240px 1fr 480px;
  align-items: center;
  padding: 0 var(--uni-gap-page);
  background: linear-gradient(180deg, rgba(9, 24, 44, 0.5), transparent);
  border-bottom: 1px solid rgba(51, 217, 255, 0.12);
}
.uni-header__left { display: flex; align-items: center; gap: 12px; }
.uni-header__logo {
  width: 46px; height: 46px; display: grid; place-items: center;
  font-size: var(--uni-fs-subtitle); font-weight: 800; color: var(--uni-accent-cyan);
  background: linear-gradient(145deg, rgba(51, 217, 255, 0.16), rgba(75, 141, 255, 0.08));
  border: 1px solid rgba(51, 217, 255, 0.3);
  clip-path: polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%);
}
.uni-header__school { font-size: 20px; font-weight: 700; color: var(--uni-text-primary); }
.uni-header__sub { font-size: var(--uni-fs-small); color: var(--uni-text-muted); margin-top: 2px; }
.uni-header__center { text-align: center; padding: 0 12px; }
.uni-title { display: flex; align-items: center; justify-content: center; gap: 16px; }
.uni-title__wing {
  flex: 1; max-width: 120px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(51, 217, 255, 0.5));
  &--r { background: linear-gradient(90deg, rgba(51, 217, 255, 0.5), transparent); }
}
.uni-title__text {
  font-size: var(--uni-fs-page-title); font-weight: 700; letter-spacing: 0.08em;
  white-space: nowrap; background: linear-gradient(180deg, #eaf4ff, #a9d8ff);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  text-shadow: 0 0 22px rgba(51, 217, 255, 0.35);
}
.uni-header__right { text-align: right; }
.uni-header__meta { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; font-size: var(--uni-fs-small); color: var(--uni-text-muted); }
.uni-header__time { font-family: var(--uni-font-number); font-size: var(--uni-fs-caption); color: var(--uni-accent-cyan); }
</style>
