<script setup lang="ts">
/**
 * 同专业对比分析 · 专业位置分析
 * 圆环展示"超过同专业学生比例"，右侧文字给出排名、优势与差距解读。
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

const option = computed<EChartsOption>(() => ({
  series: [
    {
      type: 'pie',
      radius: ['62%', '82%'],
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
              x: 0, y: 0, x2: 1, y2: 1,
              colorStops: [
                { offset: 0, color: '#34d399' },
                { offset: 1, color: '#00e5ff' },
              ],
            },
            shadowBlur: 12,
            shadowColor: 'rgba(0, 229, 255, 0.4)',
          },
        },
        {
          value: Math.max(0, 100 - percent.value),
          itemStyle: { color: 'rgba(0, 60, 120, 0.35)' },
        },
      ],
    },
  ],
}))
</script>

<template>
  <ChartCard title="同专业对比分析" sub="专业位置分析">
    <div class="major-pos">
      <div class="major-pos__ring">
        <ChartContainer :option="option" />
        <div class="major-pos__center">
          <b>{{ percent }}%</b>
          <span>超过同专业</span>
        </div>
      </div>

      <div class="major-pos__info">
        <div class="info-row">
          <span class="info-row__label">专业规模</span>
          <b class="info-row__value">{{ majorTotal }} 人</b>
        </div>
        <div class="info-row">
          <span class="info-row__label">你的排名</span>
          <b class="info-row__value info-row__value--hl">{{ majorRank }}</b>
        </div>
        <div class="info-row">
          <span class="info-row__label">超过比例</span>
          <b class="info-row__value info-row__value--hl">{{ percent }}%</b>
        </div>
        <div class="info-row">
          <span class="info-row__label">你的 GPA</span>
          <b class="info-row__value">{{ studentGpa.toFixed(2) }}</b>
        </div>
        <div class="info-row">
          <span class="info-row__label">专业平均</span>
          <b class="info-row__value">{{ majorAvgGpa.toFixed(2) }}</b>
        </div>
        <div class="info-tags">
          <div class="info-tag info-tag--good">优势：专业课程表现突出</div>
          <div class="info-tag info-tag--warn">差距：主要来自基础课程</div>
        </div>
      </div>
    </div>
  </ChartCard>
</template>

<style scoped lang="scss">
.major-pos {
  display: flex;
  align-items: center;
  gap: 18px;
  height: 100%;

  &__ring {
    position: relative;
    width: 180px;
    height: 180px;
    flex-shrink: 0;
  }

  &__center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    b {
      font-size: 30px;
      font-weight: 900;
      color: #7ff6c4;
      font-family: 'DIN Alternate', sans-serif;
      text-shadow: 0 0 14px rgba(52, 211, 153, 0.45);
      line-height: 1;
    }

    span {
      margin-top: 4px;
      font-size: 12px;
      color: #9ec7e0;
    }
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__label {
    font-size: 13px;
    color: #7eb4d8;
  }

  &__value {
    font-size: 15px;
    font-weight: 800;
    color: #f6fbff;
    font-family: 'DIN Alternate', sans-serif;

    &--hl {
      color: #7ff6c4;
    }
  }
}

.info-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 2px;
}

.info-tag {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;

  &--good {
    color: #7ff6c4;
    background: rgba(52, 211, 153, 0.12);
    border: 1px solid rgba(52, 211, 153, 0.25);
  }

  &--warn {
    color: #ffd27a;
    background: rgba(240, 192, 64, 0.1);
    border: 1px solid rgba(240, 192, 64, 0.22);
  }
}
</style>
