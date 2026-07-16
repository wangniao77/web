<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClock } from '@/composables/useClock'
import { ROUTES } from '@/constants/routes'
import type { DashboardMetaVM } from '@/types/university/view'

defineProps<{
  meta?: DashboardMetaVM | null
}>()

const principles = ['看全局', '看目标', '看趋势', '看差距', '看风险', '看成效']
const { dateStr, timeStr, weekStr } = useClock()
const router = useRouter()
const route = useRoute()

const selectedYear = ref('2025-2026')
const selectedSemester = ref('第二学期')

const navItems = [
  { label: '总览', to: ROUTES.university.root, match: 'overview' },
  { label: '科研创新', to: ROUTES.university.research, match: 'research' },
  { label: '重点任务', to: ROUTES.university.tasks, match: 'tasks' },
  { label: '学科建设', to: ROUTES.university.disciplines, match: 'disciplines' },
  { label: '就业升学', to: ROUTES.university.employment, match: 'employment' },
  { label: '人才培养', to: ROUTES.university.academicRisk, match: 'academic-risk' },
  { label: '数据口径', to: ROUTES.university.metrics, match: 'metrics' },
]

const activeNav = computed(() => {
  const name = String(route.name ?? '')
  if (name === 'university-overview') return 'overview'
  if (name.includes('research')) return 'research'
  if (name.includes('tasks') || name.includes('key-tasks')) return 'tasks'
  if (name.includes('disciplines')) return 'disciplines'
  if (name.includes('employment')) return 'employment'
  if (name.includes('academic-risk')) return 'academic-risk'
  if (name.includes('metrics')) return 'metrics'
  if (name.includes('events')) return 'overview'
  return 'overview'
})

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen()
  else document.exitFullscreen()
}
</script>

<template>
  <div class="uni-header-wrap">
    <header class="uni-header">
      <div class="uni-header__left">
        <div class="uni-header__logo">
          <span>广财</span>
        </div>
        <div>
          <div class="uni-header__school">广东财经大学</div>
          <div class="uni-header__sub">全校治理数据中心</div>
        </div>
      </div>

      <div class="uni-header__center">
        <div class="uni-title">
          <span class="uni-title__wing uni-title__wing--l" aria-hidden="true" />
          <h1 class="uni-title__text">广东财经大学高质量发展与治理数字驾驶舱</h1>
          <span class="uni-title__wing uni-title__wing--r" aria-hidden="true" />
        </div>
        <p class="uni-header__principles">
          <span v-for="(p, i) in principles" :key="p">
            {{ p }}<i v-if="i < principles.length - 1" />
          </span>
        </p>
      </div>

      <div class="uni-header__right">
        <div class="uni-header__controls">
          <label class="uni-capsule">
            <select v-model="selectedYear" aria-label="学年">
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
            </select>
          </label>
          <label class="uni-capsule">
            <select v-model="selectedSemester" aria-label="学期">
              <option value="第二学期">第二学期</option>
              <option value="第一学期">第一学期</option>
            </select>
          </label>
          <button type="button" class="uni-capsule uni-capsule--btn" @click="router.push(ROUTES.university.metrics)">数据口径</button>
          <button type="button" class="uni-capsule uni-capsule--btn" @click="toggleFullscreen">全屏</button>
        </div>
        <div class="uni-header__meta">
          <span>{{ dateStr }} {{ weekStr }}</span>
          <span class="uni-header__time">{{ timeStr }}</span>
          <span>更新 {{ meta?.dataUpdatedAt ?? '实时' }}</span>
        </div>
      </div>
    </header>

    <nav class="uni-nav" aria-label="一级导航">
      <RouterLink
        v-for="item in navItems"
        :key="item.match"
        :to="item.to"
        class="uni-nav__item"
        :class="{ 'uni-nav__item--active': activeNav === item.match }"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.uni-header-wrap {
  position: relative;
  z-index: 5;
  flex-shrink: 0;
}

.uni-header {
  height: var(--uni-header-height);
  display: grid;
  grid-template-columns: 280px 1fr 340px;
  align-items: center;
  padding: 0 var(--uni-gap-page);
  background: linear-gradient(180deg, rgba(9, 24, 44, 0.5), transparent);
  border-bottom: 1px solid rgba(51, 217, 255, 0.12);
}

.uni-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.uni-header__logo {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  font-size: 14px;
  font-weight: 800;
  color: var(--uni-accent-cyan);
  background: linear-gradient(145deg, rgba(51, 217, 255, 0.16), rgba(75, 141, 255, 0.08));
  border: 1px solid rgba(51, 217, 255, 0.3);
  clip-path: polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%);
  box-shadow: inset 0 0 12px rgba(51, 217, 255, 0.15);
}

.uni-header__school {
  font-size: 17px;
  font-weight: 700;
  color: var(--uni-text-primary);
  letter-spacing: 0.04em;
}

.uni-header__sub {
  font-size: var(--uni-fs-caption);
  color: var(--uni-text-muted);
  margin-top: 2px;
  letter-spacing: 0.12em;
}

.uni-header__center {
  text-align: center;
  padding: 0 12px;
}

.uni-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.uni-title__wing {
  flex: 1;
  max-width: 120px;
  height: 1px;
  position: relative;
  background: linear-gradient(90deg, transparent, rgba(51, 217, 255, 0.5));

  &::before {
    content: '';
    position: absolute;
    top: -3px;
    width: 7px;
    height: 7px;
    border: 1px solid var(--uni-accent-cyan);
    transform: rotate(45deg);
    box-shadow: 0 0 6px rgba(51, 217, 255, 0.6);
  }

  &--l::before { right: -2px; }
  &--r {
    background: linear-gradient(90deg, rgba(51, 217, 255, 0.5), transparent);
    &::before { left: -2px; }
  }
}

.uni-title__text {
  font-size: var(--uni-fs-page-title);
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--uni-text-primary);
  line-height: 1.2;
  white-space: nowrap;
  text-shadow: 0 0 22px rgba(51, 217, 255, 0.35);
  background: linear-gradient(180deg, #eaf4ff, #a9d8ff);
  -webkit-background-clip: text;
  background-clip: text;
}

.uni-header__principles {
  margin-top: 6px;
  font-size: var(--uni-fs-caption);
  color: var(--uni-text-muted);
  letter-spacing: 0.05em;

  i::before {
    content: '｜';
    margin: 0 4px;
    color: rgba(51, 217, 255, 0.3);
  }
}

.uni-header__right {
  text-align: right;
}

.uni-header__controls {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 8px;
}

.uni-capsule {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  font-size: var(--uni-fs-caption);
  color: var(--uni-text-secondary);
  background: rgba(9, 24, 44, 0.7);
  border: 1px solid rgba(90, 170, 255, 0.18);
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, box-shadow 0.2s;

  select {
    background: transparent;
    border: none;
    color: inherit;
    font-size: inherit;
    cursor: pointer;
    outline: none;

    option { background: #0b1c33; color: var(--uni-text-primary); }
  }

  &:hover {
    color: var(--uni-accent-cyan);
    border-color: var(--uni-border-hover);
    box-shadow: var(--uni-glow-soft);
  }
}

.uni-header__meta {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  font-size: var(--uni-fs-caption);
  color: var(--uni-text-muted);
}

.uni-header__time {
  font-family: var(--uni-font-number);
  font-size: 14px;
  color: var(--uni-accent-cyan);
  text-shadow: 0 0 10px rgba(51, 217, 255, 0.4);
}

.uni-nav {
  height: var(--uni-nav-height);
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 var(--uni-gap-page);
  border-bottom: 1px solid rgba(90, 170, 255, 0.08);
}

.uni-nav__item {
  position: relative;
  padding: 7px 18px;
  font-size: var(--uni-fs-body);
  color: var(--uni-text-secondary);
  text-decoration: none;
  letter-spacing: 0.04em;
  transition: color 0.2s;

  &:hover { color: var(--uni-text-primary); }

  &--active {
    color: var(--uni-accent-cyan);
    text-shadow: 0 0 10px rgba(51, 217, 255, 0.4);

    &::after {
      content: '';
      position: absolute;
      left: 12px;
      right: 12px;
      bottom: -1px;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--uni-accent-cyan), transparent);
      box-shadow: 0 0 8px rgba(51, 217, 255, 0.6);
    }
  }
}
</style>
