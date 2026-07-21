<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useScreenScale } from '@/composables/useScreenScale'
import { useAppStore, type ViewMode } from '@/stores/app'
import { ROUTES } from '@/constants/routes'

const router = useRouter()
const appStore = useAppStore()
const { scaleStyle, canvasStyle, wrapperStyle } = useScreenScale({ mode: 'fluid' })

type PortalEntry = {
  mode: ViewMode
  title: string
  desc: string
  route: string
}

const entries: PortalEntry[] = [
  {
    mode: 'college',
    title: '学院大屏',
    desc: '数智洞察视界',
    route: ROUTES.college.root,
  },
  {
    mode: 'university',
    title: '学校大屏',
    desc: '全校综合发展与治理驾驶舱',
    route: ROUTES.university.root,
  },
  {
    mode: 'student',
    title: '学生个人大屏',
    desc: '个人学业成长与发展驾驶舱',
    route: ROUTES.student,
  },
]

function enter(entry: PortalEntry) {
  appStore.setViewMode(entry.mode)
  router.push(entry.route)
}
</script>

<template>
  <div class="screen-wrapper portal-screen" :style="wrapperStyle">
    <div class="screen-scale portal" :style="{ ...canvasStyle, ...scaleStyle }">
      <div class="portal-bg" />
      <div class="portal-content">
        <h1 class="portal-title">发展与治理驾驶舱</h1>
        <p class="portal-sub">广东财经大学 · 请选择进入视图</p>
        <div class="portal-cards">
          <button
            v-for="entry in entries"
            :key="entry.mode"
            type="button"
            class="portal-card"
            @click="enter(entry)"
          >
            <span class="card-title">{{ entry.title }}</span>
            <span class="card-desc">{{ entry.desc }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.portal-screen {
  background: $color-bg-root;
}

.screen-scale.portal {
  align-items: center;
  justify-content: center;
  background: $color-bg-root;
}

.portal-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 40%, rgba(0, 100, 200, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 60%, rgba(0, 212, 255, 0.08) 0%, transparent 50%);
}

.portal-content {
  position: relative;
  text-align: center;
  z-index: 1;
  width: min(92%, 1200px);
  padding: 0 24px;
}

.portal-title {
  font-size: clamp(28px, 3.2vw, $college-fs-display);
  font-weight: 600;
  letter-spacing: 4px;
  background: linear-gradient(90deg, #fff, #00e5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.portal-sub {
  color: $color-text-muted;
  font-size: clamp(13px, 1.2vw, $college-fs-body);
  margin-bottom: clamp(24px, 4vh, 48px);
}

.portal-cards {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(16px, 2vw, 32px);
  justify-content: center;
}

.portal-card {
  flex: 1 1 clamp(200px, 28%, 280px);
  max-width: 280px;
  min-height: clamp(130px, 16vh, 160px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: $color-bg-card;
  border: 1px solid $color-border-accent;
  border-radius: $panel-radius;
  cursor: pointer;
  transition: all $transition-base;
  color: $color-text-primary;

  &:hover {
    border-color: $color-accent;
    box-shadow: 0 0 24px rgba(0, 229, 255, 0.2);
    transform: translateY(-4px);
  }
}

.card-title {
  font-size: clamp(15px, 1.4vw, $college-fs-title);
  font-weight: 600;
  color: $color-accent-cyan;
}

.card-desc {
  font-size: clamp(12px, 1.1vw, $college-fs-label);
  color: $color-text-muted;
  padding: 0 8px;
  line-height: 1.5;
}
</style>
