<script setup lang="ts">
/**
 * 学分进度页 · 顶部 KPI 摘要
 *
 * 5 张卡：
 * 1. 总学分进度（含进度条）
 * 2. 公共基础课
 * 3. 学科基础课
 * 4. 专业核心课
 * 5. 专业选修课
 */
import { computed } from 'vue'
import type { CategoryProgressDTO, CreditProgressSummaryDTO } from '../../_shared/credit-data'

const props = defineProps<{
  summary: CreditProgressSummaryDTO
}>()

interface KpiItem {
  key: string
  label: string
  earned: number
  required: number
  progress: number
  barColor: string
  isPrimary?: boolean
  isTotal?: boolean
}

const colorByCategory: Record<string, string> = {
  general:      '#66d9ff',
  'major-base': '#00b8ff',
  'major-core': '#00e5ff',
  elective:     '#8b5cf6',
}

const items = computed<KpiItem[]>(() => {
  const cats = props.summary.categories
  const result: KpiItem[] = [
    {
      key: 'total',
      label: '总学分进度',
      earned: props.summary.totalEarnedCredits,
      required: props.summary.totalRequiredCredits,
      progress: props.summary.overallProgress,
      barColor: '#00e5ff',
      isPrimary: true,
      isTotal: true,
    },
  ]

  for (const cat of cats) {
    result.push({
      key: cat.id,
      label: cat.name,
      earned: cat.earnedCredits,
      required: cat.requiredCredits,
      progress: cat.progress,
      barColor: colorByCategory[cat.id] ?? '#66d9ff',
    })
  }

  return result
})
</script>

<template>
  <div class="kpi-row">
    <div
      v-for="item in items"
      :key="item.key"
      class="kpi-card"
      :class="{ primary: item.isPrimary }"
    >
      <div class="kpi-head">
        <span class="kpi-label">{{ item.label }}</span>
        <span class="kpi-pct" :class="{ complete: item.progress >= 100 }">
          {{ item.progress.toFixed(1) }}%
        </span>
      </div>

      <div class="kpi-value">
        <span class="num">{{ item.earned }}</span>
        <span class="sep">/</span>
        <span class="total">{{ item.required }}</span>
        <span class="unit">学分</span>
      </div>

      <div class="kpi-bar">
        <div
          class="kpi-bar-fill"
          :style="{
            width: `${Math.min(100, item.progress)}%`,
            background: `linear-gradient(90deg, ${item.barColor}88, ${item.barColor})`,
            boxShadow: `0 0 8px ${item.barColor}55`,
          }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.kpi-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 18px;
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

.kpi-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kpi-label {
  font-size: 14px;
  color: rgba(190, 210, 238, 0.85);
  letter-spacing: 0.04em;
  font-weight: 500;
}

.kpi-pct {
  font-family: 'DIN Alternate', sans-serif;
  font-size: 15px;
  font-weight: 800;
  color: #66d9ff;

  &.complete { color: #34d399; }
}

.kpi-value {
  display: flex;
  align-items: baseline;
  gap: 3px;
  color: #f4f8ff;
  line-height: 1.1;

  .num {
    font-family: 'DIN Alternate', sans-serif;
    font-size: 28px;
    font-weight: 800;
    text-shadow: 0 1px 2px rgba(0, 10, 30, 0.9), 0 0 14px rgba(57, 230, 255, 0.48);
  }

  .sep {
    font-size: 16px;
    color: rgba(184, 236, 255, 0.5);
    margin: 0 2px;
  }

  .total {
    font-family: 'DIN Alternate', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: rgba(184, 236, 255, 0.75);
  }

  .unit {
    font-size: 12px;
    color: rgba(186, 208, 236, 0.65);
    margin-left: 4px;
  }
}

.kpi-bar {
  position: relative;
  height: 5px;
  border-radius: 3px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 184, 255, 0.12);
  overflow: hidden;
}

.kpi-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
