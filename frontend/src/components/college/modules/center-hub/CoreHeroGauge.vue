<script setup lang="ts">
import { computed } from 'vue'
import CockpitCoreMetric from '@/components/college/CockpitCoreMetric.vue'
import { kpiLayout } from '@/constants/college/college-kpi'
import type { OverviewHubKpiVM, OverviewHubVM } from '@/types/college/view'
import { scoreToneFromValue } from '@/utils/scoreTone'

const props = defineProps<{
  data: OverviewHubVM
  centerLabel?: string
  /** 中心指数悬停说明（学生舱新手引导） */
  centerTip?: string
}>()

const gaugeDeg = computed(() => {
  const value = props.data.developmentIndex
  const percent = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
  return `${percent * 3.6}deg`
})

const stars = computed(() => '★'.repeat(props.data.starLevel))
const rankText = computed(() => props.data.centerRankText?.trim() || '')
const showRank = computed(() => Boolean(rankText.value))
const rankLabel = computed(() => {
  const match = rankText.value.match(/^(.*?)(\d+\s*\/\s*\d+)\s*$/)
  return match?.[1]?.trim() || ''
})
const rankValue = computed(() => {
  const match = rankText.value.match(/(\d+\s*\/\s*\d+)\s*$/)
  return match ? match[1].replace(/\s+/g, '') : rankText.value
})
const indexText = computed(() => {
  const value = props.data.developmentIndex
  if (!Number.isFinite(value)) return String(value ?? '—')
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
})
const rankPeers = computed(() => props.data.rankPeers)
const deltaDown = computed(() => /↓|回落|下降/.test(props.data.centerDelta || ''))

const centerTitle = computed(() => props.centerLabel ?? '学院综合发展指数')

const centerTone = computed(() => scoreToneFromValue(props.data.developmentIndex))

function kpiIcon(kpi: OverviewHubKpiVM) {
  if (kpi.icon) return kpi.icon
  if (kpi.key) return kpiLayout[kpi.key].icon
  return 'academic'
}

function kpiPosition(kpi: OverviewHubKpiVM) {
  if (kpi.position) return kpi.position
  if (kpi.key) return kpiLayout[kpi.key].position
  return 'tl'
}
</script>

<template>
  <section class="core-hero-stage">
    <div class="core-hero-stage__glow" aria-hidden="true" />

    <CockpitCoreMetric
      v-for="kpi in data.kpis"
      :key="kpi.key ?? kpi.label"
      :label="kpi.label"
      :value="kpi.value"
      :value-delta="kpi.valueDelta"
      :trend="kpi.trend"
      :icon="kpiIcon(kpi)"
      :position="kpiPosition(kpi)"
      :details="kpi.details"
      :level-text="kpi.levelText"
      :score-tone="kpi.scoreTone"
      :tip="kpi.tip"
    />

    <div class="core-hero-core">
      <div class="core-gauge-square">
        <div
          class="core-gauge core-gauge--hero"
          :class="[
            `core-gauge--tone-${centerTone}`,
            {
              'core-gauge--has-tip': Boolean(centerTip) || Boolean(rankPeers),
              'core-gauge--has-rank': showRank,
            },
          ]"
        >
          <div class="core-gauge__scan-ring" aria-hidden="true" />
          <div class="core-gauge__orbit-ring core-gauge__orbit-ring--1" aria-hidden="true" />
          <div class="core-gauge__orbit-ring core-gauge__orbit-ring--2" aria-hidden="true" />
          <div class="core-gauge__outer-ring" aria-hidden="true" />
          <div class="core-gauge__halo" aria-hidden="true" />
          <div class="core-gauge__track" aria-hidden="true" />
          <div class="core-gauge__progress" aria-hidden="true" :style="{ '--gauge-deg': gaugeDeg }" />
          <div class="core-gauge__ticks" />
          <div class="core-gauge__ring core-gauge__ring--outer" />
          <div class="core-gauge__ring core-gauge__ring--inner" />
          <div class="core-gauge__content">
            <span class="core-gauge__title">{{ centerTitle }}</span>
            <div class="core-gauge__score-row">
              <strong>{{ indexText }}</strong>
              <em
                v-if="data.centerDelta"
                class="core-gauge__delta"
                :class="{ 'is-down': deltaDown }"
              >{{ data.centerDelta }}</em>
            </div>
            <div v-if="showRank" class="core-gauge__rank">
              <i v-if="rankLabel">{{ rankLabel }}</i>
              <span>{{ rankValue }}</span>
            </div>
            <template v-else>
              <small>（满分{{ data.maxScore }}）</small>
              <b>{{ stars }}</b>
            </template>
          </div>
          <div
            v-if="rankPeers"
            class="core-gauge__peers"
            role="tooltip"
          >
            <p class="core-gauge__peers-tip">{{ rankPeers.tip || '同专业排名示意（前三 / 后三）' }}</p>
            <div class="core-gauge__peers-cols">
              <div>
                <strong>前三</strong>
                <ul>
                  <li v-for="item in rankPeers.top" :key="`t-${item.rank}-${item.name}`">
                    <em>{{ item.rank }}</em>{{ item.name }}
                  </li>
                </ul>
              </div>
              <div>
                <strong>后三</strong>
                <ul>
                  <li v-for="item in rankPeers.bottom" :key="`b-${item.rank}-${item.name}`">
                    <em>{{ item.rank }}</em>{{ item.name }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p v-else-if="centerTip" class="core-gauge__tip" role="tooltip">{{ centerTip }}</p>
        </div>
      </div>

      <div class="core-hero-platform" aria-hidden="true">
        <div class="core-hero-platform__beam core-hero-platform__beam--1" />
        <div class="core-hero-platform__beam core-hero-platform__beam--2" />
        <div class="core-hero-platform__beam core-hero-platform__beam--3" />
        <div class="core-hero-platform__disc core-hero-platform__disc--1" />
        <div class="core-hero-platform__disc core-hero-platform__disc--2" />
        <div class="core-hero-platform__disc core-hero-platform__disc--3" />
        <div class="core-hero-platform__city">
          <span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.core-gauge__score-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  margin-top: 2px;
}

.core-gauge__delta {
  display: inline;
  color: #67e8a3;
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;

  &.is-down {
    color: #ff9b7a;
  }
}

.core-gauge__rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  margin-top: 4px;
  color: #9ed8f5;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  line-height: 1.2;

  i {
    color: #7aa8c4;
    font-size: 11px;
    font-style: normal;
    font-weight: 600;
    letter-spacing: 0.06em;
  }

  span {
    color: #c8eefc !important;
    font-size: 13px !important;
    font-weight: 800 !important;
    letter-spacing: 0.02em;
    text-shadow: none !important;
  }
}

.core-gauge--tone-risk .core-gauge__content strong {
  color: #ff6b6b;
  text-shadow: 0 0 16px rgba(255, 80, 80, 0.55);
}

.core-gauge--tone-warn .core-gauge__content strong {
  color: #ffd666;
  text-shadow: 0 0 16px rgba(255, 200, 80, 0.5);
}

.core-gauge--tone-good .core-gauge__content strong {
  color: #5ec8ff;
  text-shadow: 0 0 16px rgba(80, 200, 255, 0.55);
}

.core-gauge--has-tip {
  overflow: visible;
}

.core-gauge__tip,
.core-gauge__peers {
  position: absolute;
  z-index: 8;
  left: 50%;
  bottom: calc(100% - 18px);
  width: max-content;
  max-width: 280px;
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
  text-align: left;
  transform: translateX(-50%);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.18s ease,
    visibility 0s linear 0.45s;
}

.core-gauge__peers-tip {
  margin: 0 0 6px;
  color: #9ed8f5;
  font-size: 11px;
}

.core-gauge__peers-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  strong {
    display: block;
    margin-bottom: 4px;
    color: #7ec8ff;
    font-size: 11px;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    gap: 6px;
    margin: 0 0 2px;
    color: #d7eefc;
    font-size: 12px;
    white-space: nowrap;

    em {
      color: #55e995;
      font-style: normal;
      font-weight: 700;
      min-width: 1.4em;
    }
  }
}

.core-gauge--has-tip:hover .core-gauge__tip,
.core-gauge--has-tip:hover .core-gauge__peers {
  opacity: 1;
  visibility: visible;
  transition-delay: 0.45s, 0.45s;
}
</style>
