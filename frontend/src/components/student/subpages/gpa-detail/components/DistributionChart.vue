<script setup lang="ts">
/**
 * GPA 详情页 · 成绩等级分布（高质感条带 + 等级卡）
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { CHART_COLORS } from '@/styles/echarts-theme'
import type { GpaOverviewVM } from '../../_shared/gpa-data'

const props = defineProps<{
  data: GpaOverviewVM
}>()

interface Bucket {
  key: string
  label: string
  value: number
  color: string
  range: string
}

const buckets = computed<Bucket[]>(() => [
  { key: 'excellent', label: '优秀', value: props.data.excellentCount, color: CHART_COLORS.green, range: '≥ 90' },
  { key: 'good', label: '良好', value: props.data.goodCount, color: CHART_COLORS.blue, range: '80-89' },
  { key: 'medium', label: '中等', value: props.data.mediumCount, color: '#9ad0ff', range: '70-79' },
  { key: 'pass', label: '及格', value: props.data.passCount, color: '#7eb4d8', range: '60-69' },
  { key: 'fail', label: '不及格', value: props.data.failCount, color: CHART_COLORS.red, range: '< 60' },
])

const total = computed(() => buckets.value.reduce((s, b) => s + b.value, 0))

const bucketsWithPercent = computed(() =>
  buckets.value.map((b) => ({
    ...b,
    percent: total.value > 0 ? (b.value / total.value) * 100 : 0,
  })),
)

const topBucket = computed(() => [...bucketsWithPercent.value].sort((a, b) => b.value - a.value)[0])

const reveal = ref(0)
let raf = 0
function playReveal() {
  cancelAnimationFrame(raf)
  reveal.value = 0
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / 1200)
    reveal.value = 1 - Math.pow(1 - t, 3)
    if (t < 1) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}
onMounted(() => nextTick(playReveal))
watch(() => props.data, () => nextTick(playReveal), { deep: true })
onUnmounted(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="chart-card">
    <div class="chart-card__glow" aria-hidden="true" />
    <header class="chart-card__head">
      <span class="chart-card__bar" aria-hidden="true" />
      <div class="chart-card__titles">
        <h3 class="chart-card__title">成绩等级分布</h3>
        <p class="chart-card__hint">按绩点等级拆解课程结构</p>
      </div>
      <span class="chart-card__badge">共 {{ total }} 门</span>
    </header>

    <div class="chart-card__body">
      <div class="spectrum" aria-label="成绩等级分布">
        <div class="spectrum__track">
          <div
            v-for="b in bucketsWithPercent"
            :key="b.key"
            class="spectrum__seg"
            :class="{ 'is-top': b.key === topBucket.key }"
            :style="{
              '--c': b.color,
              width: `${Math.max(b.percent * reveal, b.value ? 2 : 0)}%`,
            }"
          />
        </div>
        <div class="spectrum__legend">
          <span
            v-for="b in bucketsWithPercent"
            :key="`lg-${b.key}`"
            class="spectrum__chip"
            :style="{ '--c': b.color }"
          >
            <i /><em>{{ b.label }}</em>
          </span>
        </div>
      </div>
    </div>

    <footer class="bucket-grid">
      <div
        v-for="(b, i) in bucketsWithPercent"
        :key="b.key"
        class="bucket"
        :class="{ 'is-top': b.key === topBucket.key }"
        :style="{
          '--c': b.color,
          '--i': i,
          opacity: 0.25 + 0.75 * reveal,
          transform: `translateY(${(1 - reveal) * 12}px)`,
        }"
      >
        <div class="bucket__head">
          <span class="bucket__label">{{ b.label }}</span>
          <span v-if="b.key === topBucket.key" class="bucket__tag">主峰</span>
        </div>
        <div class="bucket__range">{{ b.range }}</div>
        <div class="bucket__meter" aria-hidden="true">
          <i :style="{ width: `${b.percent * reveal}%` }" />
        </div>
        <div class="bucket__foot">
          <b>{{ Math.round(b.value * reveal) }}<small>门</small></b>
          <em>{{ Math.round(b.percent * reveal) }}%</em>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.chart-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(102, 217, 255, 0.22);
  border-radius: 12px;
  background:
    radial-gradient(120% 80% at 100% 0%, rgba(0, 180, 255, 0.12), transparent 55%),
    linear-gradient(160deg, rgba(8, 42, 86, 0.72), rgba(3, 12, 34, 0.88));
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  padding: 14px 16px 12px;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  &__glow {
    position: absolute;
    inset: auto -20% -40% auto;
    width: 55%;
    height: 70%;
    background: radial-gradient(circle, rgba(0, 229, 255, 0.12), transparent 70%);
    pointer-events: none;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.7), transparent);
  }
}

.chart-card__head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.chart-card__bar {
  width: 3px;
  height: 28px;
  margin-top: 4px;
  border-radius: 2px;
  background: linear-gradient(180deg, #7ff6ff, #00b8ff);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.55);
  flex-shrink: 0;
}

.chart-card__titles {
  min-width: 0;
  flex: 1;
}

.chart-card__title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #f4fbff;
  text-shadow: 0 0 14px rgba(0, 242, 255, 0.22);
}

.chart-card__hint {
  margin: 4px 0 0;
  font-size: 14px;
  color: rgba(158, 202, 232, 0.72);
}

.chart-card__badge {
  flex-shrink: 0;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 800;
  color: #04101f;
  background: linear-gradient(90deg, #7ef0d0, #55e0ff);
  box-shadow: 0 0 14px rgba(85, 224, 255, 0.35);
}

.chart-card__body {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
}

.spectrum {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 6px 2px 4px;
}

.spectrum__track {
  display: flex;
  height: 18px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(0, 30, 60, 0.65);
  border: 1px solid rgba(102, 217, 255, 0.16);
  box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.35);
}

.spectrum__seg {
  height: 100%;
  background: linear-gradient(180deg, color-mix(in srgb, var(--c) 88%, #fff), var(--c));
  box-shadow: 0 0 12px color-mix(in srgb, var(--c) 45%, transparent);
  transition: width 0.05s linear;

  &.is-top {
    filter: brightness(1.08);
  }
}

.spectrum__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.spectrum__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #bfe2f5;
  font-weight: 650;

  i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--c);
    box-shadow: 0 0 8px color-mix(in srgb, var(--c) 60%, transparent);
  }
  em { font-style: normal; }
}

.bucket-grid {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 212, 255, 0.12);
  position: relative;
  z-index: 1;
}

.bucket {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 11px;
  border-radius: 10px;
  background: rgba(0, 36, 72, 0.42);
  border: 1px solid rgba(102, 217, 255, 0.14);
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: color-mix(in srgb, var(--c) 55%, transparent);
    background: rgba(0, 48, 90, 0.5);
  }

  &.is-top {
    border-color: color-mix(in srgb, var(--c) 55%, transparent);
    background: linear-gradient(160deg, color-mix(in srgb, var(--c) 16%, transparent), rgba(0, 36, 72, 0.5));
    box-shadow: inset 0 0 18px color-mix(in srgb, var(--c) 12%, transparent);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
  }

  &__label {
    font-size: 16px;
    font-weight: 800;
    color: #e8f7ff;
  }

  &__tag {
    font-size: 11px;
    font-weight: 800;
    padding: 1px 6px;
    border-radius: 999px;
    color: #04101f;
    background: linear-gradient(90deg, #7ef0d0, #55e0ff);
  }

  &__range {
    font-size: 13px;
    color: rgba(158, 202, 232, 0.65);
  }

  &__meter {
    height: 5px;
    border-radius: 999px;
    background: rgba(0, 30, 60, 0.7);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, color-mix(in srgb, var(--c) 55%, #04101f), var(--c));
      box-shadow: 0 0 8px color-mix(in srgb, var(--c) 50%, transparent);
    }
  }

  &__foot {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;

    b {
      font-family: 'DIN Alternate', sans-serif;
      font-size: 24px;
      font-weight: 900;
      color: var(--c);
      line-height: 1;
      text-shadow: 0 0 12px color-mix(in srgb, var(--c) 40%, transparent);

      small {
        margin-left: 2px;
        font-size: 13px;
        font-weight: 600;
        color: rgba(184, 236, 255, 0.55);
      }
    }

    em {
      font-style: normal;
      font-size: 15px;
      font-weight: 800;
      color: #cfe8ff;
      font-family: 'DIN Alternate', sans-serif;
    }
  }
}
</style>
