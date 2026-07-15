<script setup lang="ts">
/**
 * GPA 详情页 · 顶部 KPI 摘要
 */
import type { GpaOverviewVM } from '../../_shared/gpa-data'

defineProps<{
  data: GpaOverviewVM
}>()
</script>

<template>
  <div class="kpi-row">
    <div class="kpi-card primary">
      <span class="kpi-label">累计 GPA</span>
      <span class="kpi-value">
        {{ data.cumulativeGpa.toFixed(2) }}
        <small>/ 4.0</small>
      </span>
      <span class="kpi-tag" :class="`lv-${data.level}`">{{ data.levelLabel }}</span>
    </div>

    <div class="kpi-card">
      <span class="kpi-label">加权平均分</span>
      <span class="kpi-value">
        {{ data.weightedAverage }}
        <small>分</small>
      </span>
      <span class="kpi-tag muted">专业前 {{ (100 - data.majorRankPercent).toFixed(1) }}%</span>
    </div>

    <div class="kpi-card">
      <span class="kpi-label">已修 / 应修学分</span>
      <span class="kpi-value">
        {{ data.earnedCredits }}
        <small>/ {{ data.totalCredits }}</small>
      </span>
      <span class="kpi-tag muted">完成率 {{ data.completionRate }}%</span>
    </div>

    <div class="kpi-card">
      <span class="kpi-label">优秀课程</span>
      <span class="kpi-value">{{ data.excellentCount }}<small>门</small></span>
      <span class="kpi-tag good">≥ 90 分</span>
    </div>

    <div class="kpi-card">
      <span class="kpi-label">预警课程</span>
      <span class="kpi-value">{{ data.warningCount }}<small>门</small></span>
      <span class="kpi-tag bad">&lt; 75 分</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.kpi-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 12px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.7), rgba(5, 17, 45, 0.62)),
    rgba(6, 17, 52, 0.42);
  border: 1px solid rgba(102, 217, 255, 0.12);
  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.22),
    inset 0 0 18px rgba(0, 184, 255, 0.04);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.62), transparent);
  }

  &.primary {
    border-color: rgba(0, 212, 255, 0.4);
    background:
      linear-gradient(180deg, rgba(0, 130, 200, 0.32), rgba(4, 18, 48, 0.7)),
      rgba(6, 17, 52, 0.42);
    box-shadow:
      0 8px 22px rgba(0, 130, 200, 0.18),
      inset 0 0 22px rgba(0, 212, 255, 0.12);
  }
}

.kpi-label {
  font-size: 13px;
  color: rgba(190, 210, 238, 0.8);
  letter-spacing: 0.04em;
}

.kpi-value {
  font-family: 'DIN Alternate', 'Bahnschrift', 'Roboto Condensed', 'Arial Narrow', sans-serif;
  font-size: 30px;
  font-weight: 700;
  color: #f4f8ff;
  line-height: 1.1;
  text-shadow: 0 1px 2px rgba(0, 10, 30, 0.9), 0 0 12px rgba(57, 230, 255, 0.42);

  small {
    font-size: 13px;
    color: rgba(186, 208, 236, 0.7);
    font-weight: 400;
    margin-left: 2px;
  }
}

.kpi-tag {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.18);
  color: #8ef6ff;
  font-weight: 600;
  letter-spacing: 0.04em;

  &.lv-excellent { color: #34d399; background: rgba(52, 211, 153, 0.12); border-color: rgba(52, 211, 153, 0.3); }
  &.lv-good      { color: #66d9ff; background: rgba(0, 184, 255, 0.12);  border-color: rgba(0, 212, 255, 0.3); }
  &.lv-medium    { color: #f0c040; background: rgba(240, 192, 64, 0.12);  border-color: rgba(240, 192, 64, 0.3); }
  &.lv-pass      { color: #fb923c; background: rgba(251, 146, 60, 0.12);  border-color: rgba(251, 146, 60, 0.3); }
  &.lv-fail      { color: #f87171; background: rgba(248, 113, 113, 0.12); border-color: rgba(248, 113, 113, 0.3); }

  &.good { color: #34d399; background: rgba(52, 211, 153, 0.12); border-color: rgba(52, 211, 153, 0.3); }
  &.bad  { color: #f87171; background: rgba(248, 113, 113, 0.12); border-color: rgba(248, 113, 113, 0.3); }
  &.muted { color: rgba(184, 236, 255, 0.7); }
}
</style>
