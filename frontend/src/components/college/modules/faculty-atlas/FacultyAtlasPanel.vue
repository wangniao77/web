<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'
import type { FacultyMetricKey, FacultyMetricTone } from '@/types/college/api/teacher-analytics'
import type { FacultyMetricVM, TeacherAnalyticsVM } from '@/types/college/view/teacher-analytics'
import { fmtFacultyNum, isMissingMark } from '@/utils/facultyDisplay'

const props = defineProps<{
  data: TeacherAnalyticsVM
}>()

const router = useRouter()

function openTeacherDetail(hash: 'major-support' | 'warning-center' = 'major-support') {
  router.push({ path: ROUTES.college.teacherResourceBase, hash: `#${hash}` })
}

const psi = computed(() => props.data.supportIndex)
const metrics = computed(() => props.data.metrics)
const warning = computed(() => props.data.warningSummary)

const hasWarning = computed(() => {
  const w = warning.value
  return Boolean(w && !isMissingMark(w.totalWarnings))
})

function toneClass(tone?: FacultyMetricTone) {
  if (!tone) return ''
  return `is-${tone}`
}

function formatValue(metric: FacultyMetricVM) {
  if (isMissingMark(metric.value)) return '**'
  if (metric.key === 'ratio') return `1:${metric.value}`
  if (typeof metric.value === 'number' && Number.isInteger(metric.value)) return String(metric.value)
  return fmtFacultyNum(metric.value)
}

/** 六维格只留一行目标 */
function shortTarget(key: FacultyMetricKey) {
  const t = psi.value.targets
  if (key === 'ratio') return `目标 ≤${t?.stuTeacher ?? 15}:1`
  if (key === 'doctor') return `目标 ${t?.phdRatio ?? 80}%`
  if (key === 'title') return `目标 ${t?.seniorRatio ?? 55}%`
  if (key === 'course') return '目标 100%'
  if (key === 'research') return '对照管理口径'
  return '对照五年规划'
}
</script>

<template>
  <div class="faculty-atlas">
    <header class="faculty-atlas__mast">
      <button
        type="button"
        class="faculty-atlas__hero"
        :aria-label="`查看专业支撑指数详情，当前 ${psi.score} 分`"
        @click="openTeacherDetail('major-support')"
      >
        <strong>{{ psi.score }}</strong>
        <span>专业支撑指数</span>
      </button>

      <p class="faculty-atlas__hero faculty-atlas__hero--grade">
        <strong :data-grade="psi.grade">{{ psi.gradeLabel }}</strong>
        <span>{{ psi.grade }} · {{ psi.stars }} 星</span>
      </p>

      <button
        type="button"
        class="faculty-atlas__hero faculty-atlas__hero--alert"
        :class="{ 'is-hot': hasWarning }"
        @click="openTeacherDetail('warning-center')"
      >
        <template v-if="hasWarning && warning">
          <strong>{{ warning.totalWarnings }}<small>条</small></strong>
          <span>预警 · 红 {{ warning.redCount }} · 黄 {{ warning.yellowCount }}</span>
        </template>
        <template v-else>
          <strong>**</strong>
          <span>预警数据待补</span>
        </template>
      </button>
    </header>

    <div class="faculty-atlas__read">
      <section class="faculty-atlas__lane is-ok">
        <header>优势</header>
        <p v-if="!psi.strengths.length" class="faculty-atlas__empty">单维尚未达到 80 分</p>
        <div v-else class="faculty-atlas__tags">
          <button
            v-for="item in psi.strengths"
            :key="`s-${item}`"
            type="button"
            @click="openTeacherDetail('major-support')"
          >
            {{ item }}
          </button>
        </div>
      </section>
      <section class="faculty-atlas__lane is-warn">
        <header>待提升</header>
        <p v-if="!psi.weaknesses.length" class="faculty-atlas__empty">各维均在 70 分以上</p>
        <div v-else class="faculty-atlas__tags">
          <button
            v-for="item in psi.weaknesses"
            :key="`w-${item}`"
            type="button"
            @click="openTeacherDetail('major-support')"
          >
            {{ item }}
          </button>
        </div>
      </section>
    </div>

    <div class="faculty-atlas__index" role="list">
      <button
        v-for="metric in metrics"
        :key="metric.key"
        type="button"
        class="faculty-atlas__key"
        :class="toneClass(metric.tone)"
        role="listitem"
        :aria-label="`查看${metric.label}详情`"
        @click="openTeacherDetail('major-support')"
      >
        <em>
          {{ metric.label }}
          <i v-if="metric.incomplete" title="口径不完整">代</i>
        </em>
        <b>
          {{ formatValue(metric) }}<small v-if="metric.key !== 'ratio'">{{ metric.unit }}</small>
        </b>
        <span>{{ shortTarget(metric.key) }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.faculty-atlas {
  --ink: #e8f4fc;
  --mute: #9ec4dc;
  --line: rgba(160, 214, 236, 0.2);
  --accent: #7ad8ee;
  --ok: #7ed9b8;
  --warn: #e8c07a;
  --risk: #e89a72;
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  min-height: 0;
  padding: 2px 0 4px;
  overflow: hidden;
}

.faculty-atlas__mast {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  flex: 0 0 96px;
  min-height: 0;
}

.faculty-atlas__hero {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 0 10px;
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;

  + .faculty-atlas__hero {
    box-shadow: inset 1px 0 0 var(--line);
  }

  &:hover,
  &:focus-visible {
    background: rgba(90, 180, 220, 0.08);
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  strong {
    color: var(--accent);
    font-family: 'Bahnschrift', 'DIN Alternate', ui-monospace, sans-serif;
    font-size: 42px;
    font-weight: 650;
    line-height: 0.92;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;

    small {
      margin-left: 4px;
      color: var(--mute);
      font-size: 16px;
      font-weight: 600;
    }
  }

  span {
    color: var(--ink);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.06em;
  }

  &--grade {
    cursor: default;

    strong {
      color: var(--ink);

      &[data-grade='A'] {
        color: #e8d282;
      }

      &[data-grade='D'],
      &[data-grade='E'] {
        color: var(--risk);
      }
    }
  }

  &--alert.is-hot strong {
    color: var(--risk);
  }
}

.faculty-atlas__read {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.4fr);
  gap: 8px 16px;
  flex: 0 0 auto;
  padding: 10px 10px 12px;
  border-top: 1px solid var(--line);
}

.faculty-atlas__lane {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  min-width: 0;

  header {
    flex: 0 0 auto;
    color: var(--ok);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.16em;
    line-height: 1;
  }

  &.is-warn header {
    color: var(--warn);
  }
}

.faculty-atlas__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
  min-width: 0;

  button {
    padding: 0;
    border: none;
    background: transparent;
    color: #d7f4e8;
    font-size: 16px;
    font-weight: 750;
    letter-spacing: 0.02em;
    line-height: 1.3;
    cursor: pointer;
    white-space: nowrap;

    &:hover,
    &:focus-visible {
      color: #f2fffa;
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    + button::before {
      content: '·';
      margin-right: 8px;
      color: rgba(160, 214, 236, 0.45);
    }
  }

  .is-warn & button {
    color: #f3e0c0;

    &:hover,
    &:focus-visible {
      color: #fff4dc;
    }
  }
}

.faculty-atlas__empty {
  margin: 0;
  color: rgba(180, 204, 220, 0.55);
  font-size: 14px;
  font-weight: 600;
}

.faculty-atlas__index {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  flex: 1 1 0;
  min-height: 0;
  border-top: 1px solid var(--line);
}

.faculty-atlas__key {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  min-width: 0;
  min-height: 0;
  padding: 10px 12px 12px;
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  box-shadow: inset -1px -1px 0 var(--line);

  &:nth-child(3n) {
    box-shadow: inset 0 -1px 0 var(--line);
  }

  &:nth-child(n + 4) {
    box-shadow: inset -1px 0 0 var(--line);
  }

  &:nth-child(6) {
    box-shadow: none;
  }

  &:hover,
  &:focus-visible {
    background: rgba(90, 180, 220, 0.08);
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  em {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ink);
    font-size: 16px;
    font-style: normal;
    font-weight: 800;
    letter-spacing: 0.06em;

    i {
      font-style: normal;
      font-size: 11px;
      font-weight: 800;
      padding: 0 4px;
      border: 1px solid rgba(232, 192, 122, 0.4);
      color: var(--warn);
    }
  }

  b {
    color: var(--ink);
    font-family: 'Bahnschrift', 'DIN Alternate', ui-monospace, sans-serif;
    font-size: 32px;
    font-weight: 650;
    line-height: 1;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;

    small {
      margin-left: 3px;
      color: var(--mute);
      font-size: 14px;
      font-weight: 600;
    }
  }

  span {
    color: var(--mute);
    font-size: 13px;
    font-weight: 650;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  &.is-ok b,
  &.is-up b {
    color: var(--accent);
  }

  &.is-warn b {
    color: var(--warn);
  }

  &.is-risk b,
  &.is-down b {
    color: var(--risk);
  }
}

@media (prefers-reduced-motion: reduce) {
  .faculty-atlas__hero,
  .faculty-atlas__key {
    transition: none;
  }
}
</style>
