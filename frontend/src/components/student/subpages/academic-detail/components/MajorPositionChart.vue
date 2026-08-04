<script setup lang="ts">
/**
 * 同专业对比分析 · 专业位置分析
 */
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import type { EChartsOption } from 'echarts'
import ChartCard from './ChartCard.vue'

const props = defineProps<{
  studentGpa: number
  majorAvgGpa: number
  majorRank: number
  majorTotal: number
  majorRankPercent: number
}>()

const percent = computed(() => Math.round(props.majorRankPercent * 10) / 10)
const gpaDelta = computed(() => Number((props.studentGpa - props.majorAvgGpa).toFixed(2)))
const aheadCount = computed(() => Math.max(0, props.majorTotal - props.majorRank))
const topPercent = computed(() => Math.max(0, Number((100 - percent.value).toFixed(1))))

const option = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 1100,
  series: [
    {
      type: 'pie',
      radius: ['68%', '86%'],
      center: ['50%', '50%'],
      startAngle: 90,
      silent: true,
      label: { show: false },
      labelLine: { show: false },
      data: [
        {
          value: percent.value,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#34d399' },
                { offset: 1, color: '#67e8f9' },
              ],
            },
            shadowBlur: 18,
            shadowColor: 'rgba(103, 232, 249, 0.45)',
          },
        },
        {
          value: Math.max(0.01, 100 - percent.value),
          itemStyle: { color: 'rgba(0, 40, 80, 0.55)' },
        },
      ],
    },
  ],
}))
</script>

<template>
  <ChartCard title="同专业对比分析" sub="专业位置分析" fill>
    <div class="major-pos">
      <div class="major-pos__top">
        <div class="major-pos__ring">
          <div class="major-pos__pulse" aria-hidden="true" />
          <ChartContainer :option="option" />
          <div class="major-pos__center">
            <b>{{ percent }}%</b>
            <span>超过同专业</span>
          </div>
        </div>

        <div class="kpi-grid">
          <article class="kpi">
            <span class="kpi__label">专业规模</span>
            <strong class="kpi__value">{{ majorTotal }}<small>人</small></strong>
            <em class="kpi__hint">同届参考人数</em>
          </article>
          <article class="kpi kpi--accent">
            <span class="kpi__label">你的排名</span>
            <strong class="kpi__value">{{ majorRank }}<small>/ {{ majorTotal }}</small></strong>
            <em class="kpi__hint">专业前 {{ topPercent }}%</em>
          </article>
          <article class="kpi kpi--accent">
            <span class="kpi__label">超过比例</span>
            <strong class="kpi__value">{{ percent }}<small>%</small></strong>
            <em class="kpi__hint">领先 {{ aheadCount }} 人</em>
          </article>
          <article class="kpi">
            <span class="kpi__label">你的 GPA</span>
            <strong class="kpi__value">{{ studentGpa.toFixed(2) }}</strong>
            <em class="kpi__hint">本学年累计</em>
          </article>
        </div>
      </div>

      <div class="compare-row">
        <article class="compare-card" :class="gpaDelta >= 0 ? 'is-up' : 'is-down'">
          <div class="compare-card__head">
            <span class="compare-card__label">对比专业平均</span>
            <span class="compare-card__avg">专业平均 {{ majorAvgGpa.toFixed(2) }}</span>
          </div>
          <div class="compare-card__delta">
            <strong>{{ gpaDelta >= 0 ? '+' : '' }}{{ gpaDelta.toFixed(2) }}</strong>
            <span>{{ gpaDelta >= 0 ? '高于均值' : '低于均值' }}</span>
          </div>
        </article>

        <article class="insight-card insight-card--good">
          <span class="insight-card__tag">优势观察</span>
          <b class="insight-card__title">专业课程表现突出</b>
          <p class="insight-card__desc">核心课程得分高于专业均值</p>
        </article>

        <article class="insight-card insight-card--warn">
          <span class="insight-card__tag">提升方向</span>
          <b class="insight-card__title">重点关注基础课程</b>
          <p class="insight-card__desc">保持节奏，优先巩固薄弱知识点</p>
        </article>
      </div>
    </div>
  </ChartCard>
</template>

<style scoped lang="scss">
.major-pos {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
}

.major-pos__top {
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
}

.major-pos__ring {
  position: relative;
  width: 168px;
  height: 168px;
  align-self: center;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 45%, rgba(85, 233, 149, 0.1), transparent 62%);

  :deep(.chart-container) {
    width: 168px;
    height: 168px;
  }
}

.major-pos__pulse {
  position: absolute;
  inset: 18%;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(circle, rgba(103, 232, 249, 0.2), transparent 72%);
  animation: ring-breathe 2.8s ease-in-out infinite;
}

.major-pos__center {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  b {
    font-size: 34px;
    font-weight: 900;
    color: #7ff6c4;
    font-family: 'DIN Alternate', sans-serif;
    text-shadow: 0 0 18px rgba(52, 211, 153, 0.5);
    line-height: 1;
  }

  span {
    margin-top: 6px;
    font-size: 14px;
    color: #9ec7e0;
    font-weight: 650;
  }
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  min-width: 0;
  align-content: stretch;
}

.kpi {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(102, 217, 255, 0.16);
  background:
    radial-gradient(90% 70% at 100% 0%, rgba(0, 184, 255, 0.08), transparent 55%),
    rgba(0, 28, 58, 0.5);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);

  &--accent {
    border-color: rgba(52, 211, 153, 0.28);
    .kpi__value { color: #7ff6c4; text-shadow: 0 0 12px rgba(85, 233, 149, 0.3); }
  }

  &__label {
    font-size: 15px;
    color: #7eb4d8;
    font-weight: 650;
  }

  &__value {
    font-size: 30px;
    font-weight: 900;
    color: #f6fbff;
    font-family: 'DIN Alternate', sans-serif;
    line-height: 1.1;

    small {
      margin-left: 4px;
      font-size: 16px;
      font-weight: 700;
      color: rgba(184, 236, 255, 0.55);
    }
  }

  &__hint {
    font-size: 14px;
    font-style: normal;
    color: #8fbdd8;
    font-weight: 600;
  }
}

.compare-row {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr;
  gap: 10px;
  flex-shrink: 0;
}

.compare-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(102, 217, 255, 0.18);
  background: rgba(0, 28, 58, 0.48);

  &.is-up {
    border-color: rgba(52, 211, 153, 0.35);
    .compare-card__delta strong { color: #7ff6c4; }
  }
  &.is-down {
    border-color: rgba(240, 192, 64, 0.35);
    .compare-card__delta strong { color: #ffd27a; }
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__label {
    font-size: 15px;
    color: #7eb4d8;
    font-weight: 650;
  }

  &__avg {
    font-size: 14px;
    color: #9ecae8;
    font-weight: 650;
    white-space: nowrap;
  }

  &__delta {
    display: flex;
    align-items: baseline;
    gap: 10px;

    strong {
      font-size: 36px;
      font-weight: 900;
      font-family: 'DIN Alternate', sans-serif;
      line-height: 1;
      text-shadow: 0 0 14px rgba(250, 204, 21, 0.25);
    }

    span {
      font-size: 15px;
      color: #8fbdd8;
      font-weight: 650;
    }
  }
}

.insight-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(102, 217, 255, 0.16);
  background: rgba(0, 28, 58, 0.45);
  border-left-width: 3px;

  &--good {
    border-left-color: #34d399;
    .insight-card__tag {
      background: linear-gradient(90deg, #7ef0d0, #34d399);
    }
    .insight-card__title { color: #7ff6c4; }
  }

  &--warn {
    border-left-color: #f0c040;
    .insight-card__tag {
      background: linear-gradient(90deg, #fde68a, #f0c040);
    }
    .insight-card__title { color: #ffd27a; }
  }

  &__tag {
    align-self: flex-start;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 800;
    color: #04101f;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
    line-height: 1.35;
  }

  &__desc {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: #9ecae8;
  }
}

@keyframes ring-breathe {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.08); }
}

@media (max-width: 900px) {
  .major-pos__top { grid-template-columns: 1fr; }
  .major-pos__ring { justify-self: center; }
  .compare-row { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .major-pos__pulse { animation: none; }
}
</style>
