<script setup lang="ts">
/**
 * 课程能力雷达图
 * 六维能力画像 + 分项得分卡，避免卡片下半空白。
 */
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import type { EChartsOption } from 'echarts'
import type { CourseCategory } from '../../_shared/gpa-data'
import type { CoursePoint } from './DifficultyScatter.vue'
import ChartCard from './ChartCard.vue'
import StuHint from '@/components/student/template/StuHint.vue'
import { SCORE_FORMULAS } from '@/utils/scoreFormulas'

const props = defineProps<{ points: CoursePoint[]; stabilityIndex: number }>()

function avgOf(cats: CourseCategory[]): number {
  const list = props.points.filter((p) => cats.includes(p.category))
  if (!list.length) return 60
  return Math.round(list.reduce((s, p) => s + p.score, 0) / list.length)
}

const dimItems = computed(() => {
  const values = [
    avgOf(['major-core']),
    avgOf(['practice']),
    avgOf(['major-base']),
    avgOf(['elective', 'humanity']),
    avgOf(['general', 'humanity', 'art']),
    Math.max(0, Math.min(100, Math.round(props.stabilityIndex))),
  ]
  const names = ['专业知识', '工程实践', '数学基础', '创新能力', '通识素养', '学习稳定性']
  return names.map((name, i) => {
    const score = values[i]!
    const tone =
      score >= 80 ? 'good' : score >= 60 ? 'warn' : score >= 40 ? 'orange' : 'risk'
    return { name, score, tone }
  })
})

const dims = computed(() => dimItems.value.map((d) => d.score))
const avgScore = computed(() =>
  Math.round(dims.value.reduce((s, v) => s + v, 0) / Math.max(1, dims.value.length)),
)

const insight = computed(() => {
  const items = [...dimItems.value].sort((a, b) => b.score - a.score)
  const best = items[0]!
  const worst = items[items.length - 1]!
  if (best.score - worst.score < 8) {
    return `六维发展较均衡，整体得分约 ${avgScore.value} 分。`
  }
  return `相对优势在「${best.name}」(${best.score})，短板在「${worst.name}」(${worst.score})，可针对性补强。`
})

const scoreMap = computed(() => {
  const m: Record<string, number> = {}
  for (const d of dimItems.value) m[d.name] = d.score
  return m
})

const option = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 1400,
  animationEasing: 'cubicOut',
  animationDelay: 120,
  tooltip: {
    confine: true,
    backgroundColor: 'rgba(6, 17, 52, 0.96)',
    borderColor: 'rgba(0, 212, 255, 0.35)',
    textStyle: { color: '#e2edff', fontSize: 17 },
  },
  radar: {
    indicator: dimItems.value.map((d) => ({ name: d.name, max: 100 })),
    center: ['50%', '52%'],
    radius: '70%',
    axisNameGap: 10,
    axisName: {
      color: '#e8f7ff',
      fontSize: 16,
      fontWeight: 700,
      formatter: (name: string) => {
        const score = scoreMap.value[name] ?? ''
        return `{n|${name}}\n{s|${score}}`
      },
      rich: {
        n: {
          color: '#d7ecff',
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 22,
        },
        s: {
          color: '#7ff6ff',
          fontSize: 18,
          fontWeight: 800,
          fontFamily: 'DIN Alternate, sans-serif',
          lineHeight: 24,
          textShadowColor: 'rgba(0, 229, 255, 0.45)',
          textShadowBlur: 8,
        },
      },
    },
    splitNumber: 4,
    splitLine: {
      lineStyle: { color: 'rgba(0, 212, 255, 0.22)', width: 1.2 },
    },
    splitArea: {
      show: true,
      areaStyle: {
        color: [
          'rgba(0, 184, 255, 0.02)',
          'rgba(0, 184, 255, 0.07)',
          'rgba(0, 184, 255, 0.02)',
          'rgba(0, 184, 255, 0.1)',
        ],
      },
    },
    axisLine: {
      lineStyle: { color: 'rgba(0, 212, 255, 0.28)', width: 1.2 },
    },
  },
  series: [
    {
      type: 'radar',
      symbol: 'circle',
      symbolSize: 9,
      animationDuration: 1400,
      animationEasing: 'cubicOut',
      lineStyle: {
        color: '#00e5ff',
        width: 3,
        shadowColor: 'rgba(0, 229, 255, 0.65)',
        shadowBlur: 10,
      },
      itemStyle: {
        color: '#04101f',
        borderColor: '#7ff6ff',
        borderWidth: 2.5,
        shadowColor: 'rgba(0, 229, 255, 0.8)',
        shadowBlur: 8,
      },
      areaStyle: {
        color: {
          type: 'radial',
          x: 0.5,
          y: 0.5,
          r: 0.65,
          colorStops: [
            { offset: 0, color: 'rgba(0, 229, 255, 0.18)' },
            { offset: 0.55, color: 'rgba(0, 180, 230, 0.28)' },
            { offset: 1, color: 'rgba(0, 120, 200, 0.08)' },
          ],
        },
      },
      data: [
        {
          value: dims.value,
          name: '能力画像',
        },
      ],
      z: 2,
    },
  ],
}))
</script>

<template>
  <ChartCard title="课程能力雷达图" sub="六维能力画像" fill>
    <div class="radar-panel">
      <div class="radar-panel__chart">
        <ChartContainer :option="option" />
        <div class="radar-avg" aria-hidden="true">
          <StuHint
            tip="六维能力得分的算术平均"
            :formula="'综合分 = (专业知识 + 工程实践 + 数学基础 + 创新能力 + 通识素养 + 学习稳定性) / 6'"
            :delay="280"
          >
            <b>{{ avgScore }}</b>
            <span>综合</span>
          </StuHint>
        </div>
      </div>
      <div class="radar-panel__board">
        <div class="dim-grid">
          <div
            v-for="(d, i) in dimItems"
            :key="d.name"
            class="dim-card"
            :class="`is-${d.tone}`"
            :style="{ '--i': i }"
          >
            <StuHint
              tip="悬停查看该维度分如何计算"
              :formula="SCORE_FORMULAS.abilityDim"
              :delay="280"
              block
            >
              <span class="dim-card__name">{{ d.name }}</span>
              <b class="dim-card__score">{{ d.score }}</b>
              <div class="dim-card__track" aria-hidden="true">
                <i :style="{ width: `${d.score}%` }" />
              </div>
            </StuHint>
          </div>
        </div>
        <p class="radar-insight">
          <span class="radar-insight__tag">解读</span>{{ insight }}
        </p>
      </div>
    </div>
  </ChartCard>
</template>

<style scoped lang="scss">
.radar-panel {
  display: grid;
  grid-template-rows: minmax(200px, 1.2fr) auto;
  height: 100%;
  min-height: 0;
  gap: 10px;
}

.radar-panel__chart {
  position: relative;
  min-height: 200px;
  height: 100%;
}

.radar-avg {
  position: absolute;
  left: 50%;
  top: 52%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  z-index: 1;
  animation: radar-avg-in 0.8s ease both 0.35s;

  b {
    font-size: 34px;
    font-weight: 900;
    line-height: 1;
    color: #7ff6ff;
    font-family: 'DIN Alternate', sans-serif;
    text-shadow: 0 0 16px rgba(0, 229, 255, 0.45);
    animation: radar-pulse 2.6s ease-in-out infinite;
  }

  span {
    margin-top: 2px;
    font-size: 14px;
    font-weight: 700;
    color: #9ecae8;
  }
}

.radar-panel__board {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  padding: 8px 2px 2px;
  border-top: 1px solid rgba(0, 212, 255, 0.18);
}

.dim-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.dim-card {
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(0, 40, 80, 0.42);
  border: 1px solid rgba(102, 217, 255, 0.16);
  animation: dim-in 0.5s ease both;
  animation-delay: calc(var(--i, 0) * 70ms + 500ms);

  :deep(.stu-hint) {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'name score'
      'track track';
    gap: 4px 8px;
    width: 100%;
    border-bottom: none;
  }

  &__name {
    grid-area: name;
    font-size: 17px;
    font-weight: 700;
    color: #cfe8ff;
    white-space: nowrap;
  }

  &__score {
    grid-area: score;
    font-size: 24px;
    font-weight: 900;
    color: #f4fbff;
    font-family: 'DIN Alternate', sans-serif;
    line-height: 1;
  }

  &__track {
    grid-area: track;
    height: 8px;
    border-radius: 999px;
    background: rgba(0, 30, 60, 0.7);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      width: 0;
      border-radius: inherit;
      background: linear-gradient(90deg, #1a9ad9, #55e0ff);
      box-shadow: 0 0 8px rgba(85, 224, 255, 0.45);
      animation: track-fill 1s ease both;
      animation-delay: calc(var(--i, 0) * 70ms + 650ms);
    }
  }

  &.is-good {
    border-color: rgba(52, 211, 153, 0.35);
    .dim-card__score { color: #7ef0d0; }
    .dim-card__track i {
      background: linear-gradient(90deg, #1faa6a, #34d399);
      box-shadow: 0 0 8px rgba(52, 211, 153, 0.4);
    }
  }

  &.is-warn {
    border-color: rgba(240, 192, 64, 0.4);
    .dim-card__score { color: #f0c040; }
    .dim-card__track i {
      background: linear-gradient(90deg, #c98920, #f0c040);
      box-shadow: 0 0 8px rgba(240, 192, 64, 0.4);
    }
  }

  &.is-orange {
    border-color: rgba(251, 146, 60, 0.45);
    .dim-card__score { color: #fb923c; }
    .dim-card__track i {
      background: linear-gradient(90deg, #c2410c, #fb923c);
      box-shadow: 0 0 8px rgba(251, 146, 60, 0.4);
    }
  }

  &.is-risk {
    border-color: rgba(248, 113, 113, 0.45);
    .dim-card__score { color: #f87171; }
    .dim-card__track i {
      background: linear-gradient(90deg, #b91c1c, #f87171);
      box-shadow: 0 0 8px rgba(248, 113, 113, 0.4);
    }
  }
}

.radar-insight {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 18px;
  line-height: 1.5;
  color: #d7ecff;
  background: rgba(0, 40, 80, 0.35);
  border: 1px solid rgba(102, 217, 255, 0.14);
  animation: dim-in 0.5s ease both 0.95s;

  &__tag {
    display: inline-block;
    margin-right: 8px;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 800;
    color: #04101f;
    background: linear-gradient(90deg, #7ef0d0, #34d399);
    vertical-align: middle;
  }
}

@keyframes radar-avg-in {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

@keyframes radar-pulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.18); }
}

@keyframes dim-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes track-fill {
  from { width: 0; }
}
</style>
