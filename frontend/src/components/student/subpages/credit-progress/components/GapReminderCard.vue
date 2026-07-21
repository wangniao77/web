<script setup lang="ts">
/**
 * 学分进度页 · 未达成提醒卡片（面向老师）
 *
 * 列出所有缺口项，按严重程度排序
 * 每项包含：类别、缺口描述、关注建议、相关课程
 */
import { computed } from 'vue'
import type { GapItemDTO } from '../../_shared/credit-data'

const props = defineProps<{
  gaps: GapItemDTO[]
}>()

const sortedGaps = computed(() => {
  const order = { high: 0, medium: 1, low: 2 }
  return [...props.gaps].sort(
    (a, b) => order[a.severity] - order[b.severity],
  )
})

function severityClass(sev: GapItemDTO['severity']) {
  if (sev === 'high') return 'high'
  if (sev === 'medium') return 'medium'
  return 'low'
}

function severityLabel(sev: GapItemDTO['severity']) {
  if (sev === 'high') return '紧急'
  if (sev === 'medium') return '关注'
  return '提醒'
}
</script>

<template>
  <div class="gap-card">
    <header class="gap-head">
      <span class="gap-bar" aria-hidden="true" />
      <h3 class="gap-title">未达成提醒</h3>
      <span class="gap-count">
        共 <b>{{ sortedGaps.length }}</b> 项需要关注
      </span>
    </header>

    <div class="gap-list">
      <article
        v-for="(gap, i) in sortedGaps"
        :key="i"
        class="gap-item"
        :class="`gap-item--${severityClass(gap.severity)}`"
      >
        <div class="gap-item-head">
          <span class="gap-tag" :class="`sev-${gap.severity}`">
            {{ severityLabel(gap.severity) }}
          </span>
          <span class="gap-cat">{{ gap.categoryName }}</span>
          <span class="gap-type">
            {{ gap.type === 'credits' ? '学分缺口' : '必修漏修' }}
          </span>
        </div>

        <p class="gap-desc">{{ gap.description }}</p>

        <div v-if="gap.relatedCourses && gap.relatedCourses.length" class="gap-courses">
          <span class="courses-label">涉及课程：</span>
          <span
            v-for="(c, ci) in gap.relatedCourses"
            :key="ci"
            class="course-pill"
          >
            {{ c }}
          </span>
        </div>

        <p class="gap-suggestion">
          <span class="suggest-label">关注建议</span>
          <span class="suggest-text">{{ gap.suggestion }}</span>
        </p>
      </article>
    </div>
  </div>
</template>

<style scoped lang="scss">
.gap-card {
  position: relative;
  border: 1px solid rgba(248, 113, 113, 0.22);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(120, 30, 50, 0.18), rgba(28, 8, 14, 0.78)),
    rgba(5, 18, 48, 0.54);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(248, 113, 113, 0.06);
  padding: 14px 16px 12px;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(248, 113, 113, 0.62), transparent);
  }
}

.gap-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.gap-bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: linear-gradient(180deg, #f87171, #ef4444);
  box-shadow: 0 0 6px rgba(248, 113, 113, 0.5);
  flex-shrink: 0;
}

.gap-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #f4fbff;
  text-shadow: 0 0 10px rgba(248, 113, 113, 0.22);
  letter-spacing: 0.04em;
}

.gap-count {
  margin-left: auto;
  font-size: 13px;
  color: rgba(254, 202, 202, 0.7);

  b {
      color: #f87171;
      font-weight: 800;
      font-family: 'DIN Alternate', sans-serif;
      font-size: 18px;
      margin: 0 2px;
  }
}

.gap-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 10px;
}

.gap-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 6px;
  background: rgba(4, 14, 38, 0.55);
  border: 1px solid rgba(102, 217, 255, 0.1);
  border-left: 3px solid rgba(184, 236, 255, 0.4);
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(8, 22, 56, 0.7);
  }

  &--high {
    border-left-color: #f87171;
    background: linear-gradient(90deg, rgba(248, 113, 113, 0.08), rgba(4, 14, 38, 0.55) 40%);
  }
  &--medium {
    border-left-color: #f0c040;
    background: linear-gradient(90deg, rgba(240, 192, 64, 0.06), rgba(4, 14, 38, 0.55) 40%);
  }
  &--low {
    border-left-color: #66d9ff;
  }
}

.gap-item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.gap-tag {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 3px;
  font-weight: 700;
  letter-spacing: 0.04em;

  &.sev-high   { color: #fff; background: rgba(248, 113, 113, 0.85); }
  &.sev-medium { color: #020617; background: #f0c040; }
  &.sev-low    { color: #020617; background: #66d9ff; }
}

.gap-cat {
  font-size: 15px;
  font-weight: 700;
  color: #f4fbff;
}

.gap-type {
  margin-left: auto;
  font-size: 12px;
  color: rgba(184, 236, 255, 0.6);
  padding: 2px 8px;
  border-radius: 3px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 184, 255, 0.12);
}

.gap-desc {
  margin: 0;
  font-size: 15px;
  color: rgba(230, 242, 255, 0.92);
  line-height: 1.55;
  font-weight: 500;
}

.gap-courses {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  font-size: 13px;
  color: rgba(184, 236, 255, 0.75);
}

.courses-label {
  flex-shrink: 0;
  font-weight: 600;
}

.course-pill {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 3px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.18);
  color: #9eefff;
  font-weight: 500;
  white-space: nowrap;
}

.gap-suggestion {
  margin: 0;
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(0, 212, 255, 0.12);
  font-size: 13px;
  line-height: 1.55;
}

.suggest-label {
  flex-shrink: 0;
  font-weight: 700;
  color: #f0c040;
  padding: 0 6px;
  border-radius: 2px;
  background: rgba(240, 192, 64, 0.1);
  border: 1px solid rgba(240, 192, 64, 0.22);
  align-self: flex-start;
  line-height: 1.5;
  font-size: 12px;

  &::after { content: '：'; }
}

.suggest-text {
  color: rgba(218, 238, 255, 0.85);
  font-weight: 500;
}
</style>
