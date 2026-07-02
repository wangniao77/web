<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

const entries = [
  {
    mode: 'college' as const,
    title: '学院大屏',
    desc: '学院发展与治理驾驶舱',
    route: '/college',
  },
  {
    mode: 'university' as const,
    title: '学校大屏',
    desc: '全校综合发展与治理驾驶舱',
    route: '/university',
  },
  {
    mode: 'student' as const,
    title: '学生个人大屏',
    desc: '个人学业成长与发展驾驶舱',
    route: '/student',
  },
]

function enter(entry: (typeof entries)[number]) {
  appStore.setViewMode(entry.mode)
  router.push(entry.route)
}
</script>

<template>
  <div class="portal">
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
</template>

<style scoped lang="scss">
.portal {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #020818;
  position: relative;
  overflow: hidden;
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
}

.portal-title {
  font-size: 36px;
  font-weight: 600;
  letter-spacing: 4px;
  background: linear-gradient(90deg, #fff, #00e5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.portal-sub {
  color: #8eb4d8;
  font-size: 14px;
  margin-bottom: 48px;
}

.portal-cards {
  display: flex;
  gap: 32px;
  justify-content: center;
}

.portal-card {
  width: 240px;
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(6, 30, 68, 0.75);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #fff;

  &:hover {
    border-color: #00e5ff;
    box-shadow: 0 0 24px rgba(0, 229, 255, 0.2);
    transform: translateY(-4px);
  }
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #00e5ff;
}

.card-desc {
  font-size: 12px;
  color: #8eb4d8;
  padding: 0 16px;
  line-height: 1.5;
}
</style>
