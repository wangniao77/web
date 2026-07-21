<script setup lang="ts">
import { computed } from 'vue'
import { formatTrend } from '@/utils/trend'
import DashIcon, { type IconKind, resolveIconKind } from '@/components/college/DashIcon.vue'
import type { TrendInfo } from '@/types/common'
import type { OverviewHubKpiDetailVM } from '@/types/college/view'
import type { ScoreTone } from '@/utils/scoreTone'

const props = defineProps<{
  label: string
  value: string
  /** 主分旁环比，如 ↑0.6 */
  valueDelta?: string
  trend?: TrendInfo
  icon: IconKind | string
  position: 'tl' | 'ml' | 'bl' | 'tr' | 'mr' | 'br'
  details?: OverviewHubKpiDetailVM[]
  levelText?: string
  scoreTone?: ScoreTone
  tip?: string
}>()

const deltaDown = computed(() => /↓|回落|下降/.test(props.valueDelta || ''))

const side = (position: string) => (['tl', 'ml', 'bl'].includes(position) ? 'left' : 'right')
const resolvedIcon = computed(() => resolveIconKind(props.icon))
const isRich = computed(() => Boolean(props.details?.length || props.levelText))
const toneClass = computed(() =>
  props.scoreTone && props.scoreTone !== 'neutral'
    ? `core-orbit-metric__value--${props.scoreTone}`
    : '',
)
</script>

<template>
  <div
    class="core-orbit-metric"
    :class="[
      `core-orbit-metric--${side(position)}`,
      `core-orbit--${position}`,
      {
        'core-orbit-metric--rich': isRich,
        'core-orbit-metric--has-tip': Boolean(tip),
      },
    ]"
  >
    <div class="core-orbit-metric__head">
      <div class="core-orbit-metric__icon">
        <DashIcon :kind="resolvedIcon" :size="isRich ? 18 : 20" />
      </div>
      <div class="core-orbit-metric__body">
        <span class="core-orbit-metric__label">{{ label }}</span>
        <strong
          v-if="!levelText"
          class="core-orbit-metric__value"
          :class="toneClass"
        >
          {{ value }}<em
            v-if="valueDelta"
            class="core-orbit-metric__delta"
            :class="{ 'is-down': deltaDown }"
          >{{ valueDelta }}</em>
        </strong>
        <strong
          v-else
          class="core-orbit-metric__value core-orbit-metric__value--level"
          :class="toneClass"
        >{{ levelText }}</strong>
        <em v-if="formatTrend(trend)" class="core-orbit-metric__trend">{{ formatTrend(trend) }}</em>
      </div>
    </div>

    <div v-if="details?.length" class="core-orbit-metric__details">
      <p
        v-for="item in details"
        :key="item.label"
        class="core-orbit-metric__detail"
        :class="{ 'core-orbit-metric__detail--has-tip': Boolean(item.tip) }"
      >
        <span>{{ item.label }}</span>
        <b>{{ item.value }}</b>
        <i v-if="item.tip" class="core-orbit-metric__detail-tip" role="tooltip">{{ item.tip }}</i>
      </p>
    </div>

    <p v-if="tip" class="core-orbit-metric__tip" role="tooltip">{{ tip }}</p>
  </div>
</template>

<style scoped lang="scss">
.core-orbit-metric__head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.core-orbit-metric--rich {
  flex-direction: column;
  align-items: stretch;
  gap: 6px;

  .core-orbit-metric__head {
    gap: 8px;
  }

  .core-orbit-metric__body {
    min-width: 0;
    flex: 1;
  }
}

.core-orbit-metric--has-tip {
  overflow: visible;
  z-index: 6;

  &:hover {
    z-index: 12;
  }
}

.core-orbit-metric__value--risk {
  color: #ff6b6b !important;
  text-shadow: 0 0 12px rgba(255, 80, 80, 0.55) !important;
}

.core-orbit-metric__value--warn {
  color: #ffd666 !important;
  text-shadow: 0 0 12px rgba(255, 200, 80, 0.5) !important;
}

.core-orbit-metric__value--good {
  color: #5ec8ff !important;
  text-shadow: 0 0 12px rgba(80, 200, 255, 0.55) !important;
}

.core-orbit-metric__value--level {
  font-size: 18px !important;
  letter-spacing: 0.04em;
}

.core-orbit-metric__delta {
  margin-left: 4px;
  color: #55e995;
  font-size: 0.72em;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.02em;
  vertical-align: baseline;

  &.is-down {
    color: #ff9b7a;
  }
}

.core-orbit-metric__details {
  margin-top: 0;
  padding: 6px 8px;
  border: 1px solid rgba(120, 200, 255, 0.18);
  border-radius: 4px;
  background: rgba(0, 30, 60, 0.45);

  p {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin: 0 0 3px;
    font-size: 11px;
    line-height: 1.3;
    position: relative;

    &:last-child { margin-bottom: 0; }
  }

  span { color: #7aa4c0; }
  b { color: #cfefff; font-weight: 600; }
}

.core-orbit-metric__tip,
.core-orbit-metric__detail-tip {
  position: absolute;
  z-index: 20;
  left: 50%;
  bottom: calc(100% + 8px);
  width: max-content;
  max-width: 220px;
  padding: 8px 10px;
  border: 1px solid rgba(120, 200, 255, 0.35);
  border-radius: 6px;
  background: rgba(6, 24, 48, 0.96);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
  color: #d7eefc;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: 1.45;
  letter-spacing: 0.02em;
  text-align: left;
  white-space: normal;
  transform: translateX(-50%);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.18s ease,
    visibility 0s linear 0.45s;
}

.core-orbit-metric:hover > .core-orbit-metric__tip,
.core-orbit-metric__detail:hover > .core-orbit-metric__detail-tip {
  opacity: 1;
  visibility: visible;
  transition-delay: 0.45s, 0.45s;
}

.core-orbit-metric__detail-tip {
  bottom: calc(100% + 4px);
  max-width: 200px;
  font-size: 11px;
}

.core-orbit--bl .core-orbit-metric__tip,
.core-orbit--br .core-orbit-metric__tip {
  bottom: auto;
  top: calc(100% + 8px);
}

.core-orbit-metric--left .core-orbit-metric__tip {
  left: 0;
  transform: none;
}

.core-orbit-metric--right .core-orbit-metric__tip {
  left: auto;
  right: 0;
  transform: none;
}
</style>
