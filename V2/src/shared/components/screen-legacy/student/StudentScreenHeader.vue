<script setup lang="ts">
import { useClock } from '@/shared/composables/useClock'

const principles = ['我的学业', '我的成长', '我的规划']
const { dateStr, timeStr, weekStr } = useClock()
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
      <p class="subtitle">看见我的成长，规划我的未来</p>
      <div class="principles">
        <span v-for="(p, i) in principles" :key="p" class="tag">
          {{ p }}<span v-if="i < principles.length - 1" class="tag-sep" />
        </span>
      </div>
    </div>

    <div class="header-right">
      <div class="meta-line date-line">{{ dateStr }} &nbsp; {{ weekStr }}</div>
      <div class="meta-line semester">2024-2025 第2学期</div>
      <div class="meta-line time-row">
        <span class="time">{{ timeStr }}</span>
        <span class="weather">22°C 阴</span>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  height: $header-height;
  display: grid;
  grid-template-columns: 300px 1fr 240px;
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
  background: linear-gradient(145deg, rgba(0, 229, 255, 0.12), rgba(5, 14, 34, 0.18));
  box-shadow: inset 0 0 18px rgba(0, 184, 255, 0.16), 0 0 18px rgba(0, 184, 255, 0.08);
}

.logo-svg { width: 42px; height: 42px; display: block; }

.school { display: flex; flex-direction: column; gap: 2px; }
.school-name { font-size: $college-fs-body; font-weight: 700; color: #f4f8ff; }
.school-sub  { font-size: $college-fs-label; color: rgba(174, 198, 230, 0.62); }

.header-center { text-align: center; position: relative; z-index: 1; }

.title { margin-bottom: 4px; }

.title-text {
  font-family: var(--student-font-body, inherit);
  font-size: $college-fs-display;
  font-weight: 800;
  color: #f7fbff;
  background: linear-gradient(180deg, #ffffff 0%, #d8edff 46%, #82dfff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 18px rgba(0, 184, 255, 0.22);
}

.subtitle {
  font-size: $college-fs-label;
  color: rgba(174, 198, 230, 0.72);
  margin-bottom: 6px;
}

.principles { display: flex; align-items: center; justify-content: center; gap: 8px; }

.tag {
  font-size: $college-fs-label;
  color: rgba(191, 213, 240, 0.76);
  padding: 0 8px;
}

.tag-sep {
  display: inline-block;
  width: 1px;
  height: 10px;
  background: rgba(255,255,255,0.08);
  vertical-align: middle;
  margin-left: 8px;
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  position: relative;
  z-index: 1;
}

.meta-line {
  font-size: $college-fs-label;
  color: $color-text-secondary;
  white-space: nowrap;

  &.semester { font-size: $college-fs-meta; color: $color-text-muted; }
}

.time-row {
  display: flex;
  align-items: baseline;
  gap: 10px;

  .time {
    font-family: var(--student-font-number, inherit);
    font-size: $college-fs-highlight;
    font-weight: 700;
    color: $color-text-primary;
    text-shadow: 0 0 10px rgba(0, 184, 255, 0.28);
  }

  .weather {
    font-size: $college-fs-label;
    color: $color-accent-cyan;
  }
}
</style>
