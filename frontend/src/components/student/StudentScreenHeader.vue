<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useClock } from '@/composables/useClock'
import { ROUTES } from '@/constants/routes'
import DashIcon from '@/components/college/DashIcon.vue'
import StuHint from '@/components/student/template/StuHint.vue'
import collegeLogo from '@/assets/college-logo.png'

/** 领导审定导向条 */
const principles = [
  { label: '看画像', tip: '先看学生整体画像与关键指标。' },
  { label: '深析短板', tip: '再定位学业、素养或就业短板。' },
  { label: '智育成才', tip: '结合 AI 建议开展精准育人。' },
]
const { dateStr, timeStr } = useClock()
</script>

<template>
  <header class="cockpit-header stu-screen-header">
    <div class="cockpit-header__grid" aria-hidden="true" />
    <div class="cockpit-header__beam cockpit-header__beam--left" aria-hidden="true" />
    <div class="cockpit-header__beam cockpit-header__beam--right" aria-hidden="true" />

    <div class="cockpit-header__brand">
      <RouterLink :to="ROUTES.portal" class="stu-screen-header__back" title="返回统一门户">← 门户</RouterLink>
      <div class="school-emblem">
        <span class="school-emblem__halo" aria-hidden="true" />
        <img :src="collegeLogo" class="school-emblem__img" alt="广东财经大学校徽" />
      </div>
      <div class="school-name">
        <span class="school-name__title">广东财经大学</span>
        <span class="school-name__school">大数据与人工智能学院</span>
        <StuHint tip="学院院训：韧性成长，志臻卓越。">
          <span class="school-name__motto">韧　性　成　长，志　臻　卓　越</span>
        </StuHint>
      </div>
    </div>

    <div class="cockpit-header__title">
      <div class="cockpit-header__title-wings" aria-hidden="true" />
      <div class="cockpit-header__title-halo" aria-hidden="true">
        <span />
        <span />
      </div>
      <StuHint tip="学生个人驾驶舱：数智透视学情，呈现学子全息画像。">
        <h1>——数智透视·学子全息——</h1>
      </StuHint>
      <nav class="cockpit-header__tabs" aria-label="学生工作导向">
        <span v-for="(tab, index) in principles" :key="tab.label">
          <StuHint :tip="tab.tip">{{ tab.label }}</StuHint>
          <b v-if="index < principles.length - 1">｜</b>
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
      <StuHint tip="当前为学生个人驾驶舱视角。">
        <div class="meta-card meta-card--live">
          <DashIcon kind="status" :size="16" />
          <span>学生视图</span>
          <i class="meta-card__pulse" aria-hidden="true" />
        </div>
      </StuHint>
    </div>
  </header>
</template>

<style scoped lang="scss">
.stu-screen-header {
  position: relative;
  overflow: visible;
}

.stu-screen-header__back {
  display: none;
}

.cockpit-header__grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, transparent, rgba(0, 200, 255, 0.04), transparent),
    repeating-linear-gradient(90deg, rgba(57, 230, 255, 0.04) 0 1px, transparent 1px 28px);
  mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
  opacity: 0.7;
}

.cockpit-header__beam {
  position: absolute;
  top: 18%;
  bottom: 18%;
  width: 1px;
  pointer-events: none;
  background: linear-gradient(180deg, transparent, rgba(140, 220, 255, 0.55), transparent);
  box-shadow: 0 0 10px rgba(90, 190, 255, 0.28);
  animation: stuHeaderBeamPulse 5s ease-in-out infinite;

  &--left { left: 27%; }
  &--right { right: 27%; animation-delay: 1.6s; }
}

.cockpit-header__brand {
  position: relative;
  z-index: 1;
  padding-left: 18px;
}

.school-emblem {
  position: relative;
  isolation: isolate;
  width: 92px;
  height: 92px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.school-emblem__halo {
  position: absolute;
  inset: -3px;
  z-index: -1;
  border-radius: 50%;
  border: 1px solid rgba(140, 220, 255, 0.28);
  background:
    conic-gradient(from 40deg, transparent, rgba(140, 220, 255, 0.22), transparent 38%, rgba(200, 170, 110, 0.18), transparent 62% 100%),
    radial-gradient(circle, rgba(0, 160, 220, 0.12), transparent 72%);
  animation: stuEmblemSpin 16s linear infinite;
  filter: drop-shadow(0 0 8px rgba(90, 190, 255, 0.22));
}

.school-name {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
}

.school-name__title {
  font-size: 24px;
  line-height: 1;
  font-weight: 800;
  color: #f7fbff;
  letter-spacing: 0.06em;
  text-shadow: 0 1px 3px rgba(0, 12, 30, 0.65);
}

.school-name__school {
  font-size: 17px;
  font-weight: 700;
  color: #7aefff;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(0, 180, 220, 0.28);
}

.school-name__motto {
  font-size: 18px !important;
  font-weight: 700 !important;
  color: #e8c878 !important;
  letter-spacing: 0.22em;
  text-shadow: 0 0 10px rgba(232, 200, 120, 0.35);
}

:deep(.cockpit-header__title h1) {
  font-size: clamp(28px, 2.1vw, 36px);
  letter-spacing: 0.12em;
}

:deep(.cockpit-header__tabs) {
  font-size: 15px;
  letter-spacing: 0.12em;
}

.school-emblem__img {
  width: 92px;
  height: 92px;
  display: block;
  object-fit: contain;
  border-radius: 50%;
  filter: drop-shadow(0 0 12px rgba(90, 190, 255, 0.32));
}

.cockpit-header__title {
  position: relative;
  z-index: 1;
}

.cockpit-header__title-halo {
  position: absolute;
  left: 50%;
  top: 48%;
  width: min(92%, 620px);
  height: 54px;
  transform: translate(-50%, -50%);
  pointer-events: none;

  span {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: radial-gradient(ellipse at center, rgba(90, 190, 255, 0.2), transparent 70%);
    filter: blur(10px);
    animation: stuTitleHalo 5.5s ease-in-out infinite;
  }

  span:last-child {
    inset: 8px 12%;
    opacity: 0.55;
    animation-delay: 1.4s;
  }
}

.meta-card {
  position: relative;
  overflow: hidden;

  :deep(svg) {
    width: 14px;
    height: 14px;
    color: #55dfff;
  }
}

.meta-card--live {
  border-color: rgba(0, 230, 160, 0.35);
}

.meta-card__pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3dffb0;
  box-shadow: 0 0 10px rgba(61, 255, 176, 0.8);
  animation: stuLivePulse 1.8s ease-in-out infinite;
}

@keyframes stuHeaderBeamPulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}

@keyframes stuEmblemSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes stuTitleHalo {
  0%, 100% { opacity: 0.45; transform: scaleX(0.92); }
  50% { opacity: 0.95; transform: scaleX(1.04); }
}

@keyframes stuLivePulse {
  0%, 100% { opacity: 0.55; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.25); }
}

@media (prefers-reduced-motion: reduce) {
  .school-emblem__halo,
  .cockpit-header__beam,
  .cockpit-header__title-halo span,
  .meta-card__pulse {
    animation: none;
  }
}
</style>
