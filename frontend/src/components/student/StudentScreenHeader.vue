<script setup lang="ts">
import { useClock } from '@/composables/useClock'
import { useScope } from '@/composables/useScope'

const { dateStr, timeStr, weekStr } = useClock()
const { termLabel } = useScope()
</script>

<template>
  <header class="header">
    <div class="header-line" />

    <div class="header-left">
      <div class="logo">
        <svg viewBox="0 0 40 40" class="logo-svg">
          <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(0, 212, 255, 0.15)" stroke-width="1.2" />
          <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(0, 184, 255, 0.3)" stroke-width="0.8" />
          <circle cx="20" cy="8" r="1.5" fill="rgba(0, 212, 255, 0.5)" />
          <circle cx="20" cy="32" r="1.5" fill="rgba(0, 212, 255, 0.5)" />
          <circle cx="8" cy="20" r="1.5" fill="rgba(0, 212, 255, 0.5)" />
          <circle cx="32" cy="20" r="1.5" fill="rgba(0, 212, 255, 0.5)" />
          <text x="20" y="25" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="12" font-weight="700">广财</text>
        </svg>
      </div>
      <div class="school">
        <span class="school-name">广东财经大学</span>
        <span class="school-sub">大数据与人工智能学院</span>
      </div>
    </div>

    <div class="header-center">
      <h1 class="title">
        <span class="title-text">学生个人成长档案</span>
      </h1>
    </div>

    <div class="header-right">
      <div class="meta-line date-line">{{ dateStr }} &nbsp; {{ weekStr }}</div>
      <div class="meta-line semester">{{ termLabel }}</div>
      <div class="meta-line time-row">
        <span class="time">{{ timeStr }}</span>
        <span class="weather">22°C 阴</span>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  height: 88px;
  display: grid;
  grid-template-columns: 320px 1fr 260px;
  align-items: center;
  padding: 0 30px;
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(8, 22, 50, 0.92) 0%, rgba(3, 11, 31, 0.62) 100%),
    $color-bg-header;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(93, 198, 255, 0.14);
  box-shadow: inset 0 -22px 44px rgba(0, 184, 255, 0.035);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 22%;
    right: 22%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(240, 192, 64, 0.42), rgba(0, 229, 255, 0.56), transparent);
  }
}

.header-line {
  position: absolute;
  bottom: 0;
  left: 5%;
  right: 5%;
  height: 1px;
  z-index: 2;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 184, 255, 0.06) 15%,
    rgba(0, 229, 255, 0.78) 50%,
    rgba(240, 192, 64, 0.12) 76%,
    transparent 100%
  );
  animation: line-pulse 4s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(0, 184, 255, 0.35), 0 0 24px rgba(0, 184, 255, 0.1);
}

@keyframes line-pulse {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.logo {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(145deg, rgba(0, 229, 255, 0.2), rgba(5, 14, 34, 0.28));
  box-shadow: inset 0 0 20px rgba(0, 184, 255, 0.3), 0 0 20px rgba(0, 184, 255, 0.22);
  animation: student-logo-glow 4.5s ease-in-out infinite;
}

@keyframes student-logo-glow {
  0%, 100% { box-shadow: inset 0 0 18px rgba(0, 184, 255, 0.24), 0 0 16px rgba(0, 184, 255, 0.16); }
  50%      { box-shadow: inset 0 0 24px rgba(0, 184, 255, 0.38), 0 0 26px rgba(0, 184, 255, 0.3); }
}

.logo-svg { width: 42px; height: 42px; display: block; }

.school { display: flex; flex-direction: column; gap: 2px; }
.school-name { font-size: var(--fs-body); font-weight: 700; color: #f4f8ff; }
.school-sub  { font-size: var(--fs-label); color: rgba(174, 198, 230, 0.62); }

.header-center { text-align: center; position: relative; z-index: 1; }

.title { margin: 0; line-height: 1.08; }

.title-text {
  font-family: var(--student-font-body, inherit);
  font-size: $college-fs-display;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 0 14px rgba(255, 255, 255, 0.55), 0 0 28px rgba(57, 230, 255, 0.55);
  letter-spacing: 0.02em;
  animation: student-title-glow 4s ease-in-out infinite;
}

@keyframes student-title-glow {
  0%, 100% { text-shadow: 0 0 14px rgba(255, 255, 255, 0.5), 0 0 22px rgba(57, 230, 255, 0.45); }
  50%      { text-shadow: 0 0 18px rgba(255, 255, 255, 0.72), 0 0 36px rgba(57, 230, 255, 0.72); }
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  position: relative;
  z-index: 1;
}

.meta-line {
  font-size: var(--fs-label);
  line-height: 1.2;
  color: $color-text-secondary;
  white-space: nowrap;

  &.semester { font-size: var(--fs-meta); color: $color-text-muted; }
}

.time-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  line-height: 1.1;

  .time {
    font-family: var(--student-font-number, inherit);
    font-size: var(--fs-highlight);
    font-weight: 700;
    line-height: 1.1;
    color: $color-text-primary;
    text-shadow: 0 0 10px rgba(0, 184, 255, 0.28);
  }

  .weather {
    font-size: var(--fs-label);
    color: $color-accent-cyan;
  }
}
</style>
