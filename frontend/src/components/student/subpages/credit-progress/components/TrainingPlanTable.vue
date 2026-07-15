<script setup lang="ts">
/**
 * 学分进度页 · 个人培养方案进度表（占满整行）
 *
 * 全部课程列表（按类别分组），状态徽章显示老师最关心的达成情况。
 * 老师一眼就能看出：
 * - 哪些必修课已修 / 未修
 * - 哪些选修课已选
 * - 整体培养方案达成情况
 */
import { computed, ref } from 'vue'
import type { CourseStatus, PlanCategory, PlanCourseDTO } from '../../_shared/credit-data'

interface CategoryGroup {
  id: PlanCategory
  name: string
  requiredCredits: number
  earnedCredits: number
  courses: PlanCourseDTO[]
}

const props = defineProps<{
  courses: PlanCourseDTO[]
  categories: Array<{ id: PlanCategory; name: string; requiredCredits: number; earnedCredits: number }>
}>()

type FilterMode = 'all' | 'required' | 'gap' | 'completed'

const activeFilter = ref<FilterMode>('all')
const activeCategory = ref<PlanCategory | 'all'>('all')

const grouped = computed<CategoryGroup[]>(() => {
  // 按类别过滤
  const filtered = props.courses.filter((c) => {
    if (activeCategory.value !== 'all' && c.category !== activeCategory.value) return false
    if (activeFilter.value === 'required' && !c.required) return false
    if (activeFilter.value === 'completed' && c.status !== 'completed') return false
    if (activeFilter.value === 'gap' && (c.status === 'completed' || !c.required)) return false
    return true
  })

  return props.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    requiredCredits: cat.requiredCredits,
    earnedCredits: cat.earnedCredits,
    courses: filtered
      .filter((c) => c.category === cat.id)
      .sort((a, b) => {
        // 已修排在前面，然后按学期
        const order: Record<CourseStatus, number> = {
          completed: 0,
          'in-progress': 1,
          failed: 2,
          'not-started': 3,
        }
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
        return a.recommendedSemester - b.recommendedSemester
      }),
  })).filter((g) => g.courses.length > 0)
})

function statusLabel(status: CourseStatus): string {
  return {
    completed: '已通过',
    'in-progress': '在修',
    'not-started': '未修',
    failed: '不及格',
  }[status]
}

function statusClass(status: CourseStatus): string {
  return `st-${status}`
}

const totalShown = computed(() => grouped.value.reduce((s, g) => s + g.courses.length, 0))
</script>

<template>
  <div class="plan-table">
    <header class="tbl-head">
      <span class="tbl-bar" aria-hidden="true" />
      <h3 class="tbl-title">个人培养方案进度表</h3>
      <span class="tbl-sub">共 {{ totalShown }} 门课程 · 按状态/类别筛选</span>
    </header>

    <!-- 筛选器 -->
    <div class="filters">
      <div class="filter-group">
        <span class="filter-label">类别</span>
        <button
          type="button"
          class="chip"
          :class="{ active: activeCategory === 'all' }"
          @click="activeCategory = 'all'"
        >
          全部
        </button>
        <button
          v-for="cat in props.categories"
          :key="cat.id"
          type="button"
          class="chip"
          :class="{ active: activeCategory === cat.id }"
          @click="activeCategory = cat.id"
        >
          {{ cat.name }}
        </button>
      </div>
      <div class="filter-group">
        <span class="filter-label">状态</span>
        <button
          v-for="mode in [
            { key: 'all', label: '全部' },
            { key: 'required', label: '仅必修' },
            { key: 'completed', label: '已通过' },
            { key: 'gap', label: '未修必修' },
          ]"
          :key="mode.key"
          type="button"
          class="chip"
          :class="['chip-status', `chip-${mode.key}`, { active: activeFilter === mode.key }]"
          @click="activeFilter = mode.key as FilterMode"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>

    <!-- 课程表（按类别分组） -->
    <div class="tables-wrap">
      <div v-for="group in grouped" :key="group.id" class="group">
        <div class="group-head">
          <span class="group-name">{{ group.name }}</span>
          <span class="group-progress">
            <span class="progress-val">{{ group.earnedCredits }}</span>
            <span class="progress-sep">/</span>
            <span class="progress-total">{{ group.requiredCredits }}</span>
            <span class="progress-unit">学分</span>
          </span>
          <span class="group-bar">
            <span
              class="group-bar-fill"
              :style="{
                width: `${Math.min(100, (group.earnedCredits / group.requiredCredits) * 100)}%`,
              }"
            />
          </span>
        </div>

        <table class="course-tbl">
          <thead>
            <tr>
              <th class="th-name">课程名称</th>
              <th class="th-credit">学分</th>
              <th class="th-req">性质</th>
              <th class="th-sem">建议修读</th>
              <th class="th-status">状态</th>
              <th class="th-score">成绩</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in group.courses"
              :key="c.id"
              :class="[statusClass(c.status), { 'is-warning': c.status === 'failed' }]"
            >
              <td>
                <span class="course-name">{{ c.name }}</span>
              </td>
              <td class="td-num">{{ c.credit }}</td>
              <td>
                <span class="req-tag" :class="c.required ? 'required' : 'elective'">
                  {{ c.required ? '必修' : '选修' }}
                </span>
              </td>
              <td class="td-sem">{{ c.recommendedSemesterLabel }}</td>
              <td>
                <span class="status-pill" :class="statusClass(c.status)">
                  {{ statusLabel(c.status) }}
                </span>
              </td>
              <td class="td-score">
                <span v-if="c.score != null" :class="{ 'fail-score': c.status === 'failed' }">
                  {{ c.score }}
                </span>
                <span v-else class="muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!grouped.length" class="empty">没有符合条件的课程</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.plan-table {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(102, 217, 255, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.16), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.54);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(0, 184, 255, 0.06);
  padding: 20px 26px 18px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  /* 字号体系（统一放大） */
  --fs-title:    24px;
  --fs-sub:      15px;
  --fs-filter:   14px;
  --fs-chip:     14px;
  --fs-group:    16px;
  --fs-progress: 18px;
  --fs-progress-total: 18px;
  --fs-th:       14px;
  --fs-td:       16px;
  --fs-pill:     13px;
  --fs-tag:      13px;
  --td-py: 14px;
  --td-px: 16px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.62), transparent);
  }
}

.tbl-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.tbl-bar {
  width: 5px;
  height: 22px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00e5ff, #00b8ff);
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.5);
  flex-shrink: 0;
}

.tbl-title {
  margin: 0;
  font-size: var(--fs-title);
  font-weight: 800;
  color: #f4fbff;
  text-shadow: 0 0 12px rgba(0, 242, 255, 0.28);
  letter-spacing: 0.04em;
}

.tbl-sub {
  margin-left: auto;
  font-size: var(--fs-sub);
  color: rgba(184, 236, 255, 0.55);
}

/* ── 筛选器 ────────────────────────────────────────── */
.filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 6px;
  background: rgba(0, 184, 255, 0.04);
  border: 1px solid rgba(0, 212, 255, 0.1);
  flex-shrink: 0;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: var(--fs-filter);
  font-weight: 600;
  color: rgba(184, 236, 255, 0.65);
  margin-right: 6px;
  flex-shrink: 0;
  letter-spacing: 0.04em;
}

.chip {
  font-size: var(--fs-chip);
  padding: 5px 14px;
  border-radius: 999px;
  background: rgba(0, 184, 255, 0.04);
  border: 1px solid rgba(0, 184, 255, 0.12);
  color: rgba(184, 236, 255, 0.7);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  font-weight: 600;

  &:hover {
    background: rgba(0, 184, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
    color: #f0f6ff;
  }

  &.active {
    background: linear-gradient(180deg, rgba(0, 184, 255, 0.32), rgba(4, 18, 48, 0.5));
    border-color: rgba(0, 212, 255, 0.55);
    color: #ffffff;
    box-shadow: inset 0 0 8px rgba(0, 212, 255, 0.18);
  }

  &.chip-gap.active {
    background: linear-gradient(180deg, rgba(248, 113, 113, 0.32), rgba(48, 12, 18, 0.5));
    border-color: rgba(248, 113, 113, 0.55);
    box-shadow: inset 0 0 8px rgba(248, 113, 113, 0.18);
  }
}

/* ── 课程分组 ────────────────────────────────────────── */
.tables-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 184, 255, 0.3) transparent;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 184, 255, 0.3); border-radius: 4px; }
}

.group {
  margin-bottom: 16px;

  &:last-child { margin-bottom: 0; }
}

.group-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  background: rgba(0, 184, 255, 0.06);
  border-left: 3px solid #00b8ff;
}

.group-name {
  font-size: var(--fs-group);
  font-weight: 700;
  color: #f4fbff;
  letter-spacing: 0.04em;
}

.group-progress {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-size: 13px;
  color: rgba(184, 236, 255, 0.7);

  .progress-val {
    font-family: 'DIN Alternate', sans-serif;
    font-size: var(--fs-progress);
    font-weight: 800;
    color: #f0c040;
  }
  .progress-sep { margin: 0 1px; color: rgba(184, 236, 255, 0.4); }
  .progress-total {
    font-family: 'DIN Alternate', sans-serif;
    font-size: var(--fs-progress-total);
    font-weight: 600;
    color: rgba(184, 236, 255, 0.7);
  }
  .progress-unit {
    font-size: 12px;
    color: rgba(184, 236, 255, 0.5);
    margin-left: 3px;
  }
}

.group-bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 184, 255, 0.12);
  overflow: hidden;
  max-width: 240px;
}

.group-bar-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #00e5ff, #00b8ff);
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.4);
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ── 课程表 ────────────────────────────────────────────── */
.course-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-td);
  border: 1px solid rgba(102, 217, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;

  th, td {
    padding: var(--td-py) var(--td-px);
    text-align: left;
    border-bottom: 1px solid rgba(102, 217, 255, 0.06);
    white-space: nowrap;
  }

  thead th {
    color: #a8f0ff;
    font-weight: 800;
    font-size: var(--fs-th);
    letter-spacing: 0.04em;
    padding-top: 12px;
    padding-bottom: 12px;
    background: linear-gradient(90deg, rgba(0, 184, 255, 0.1), rgba(0, 184, 255, 0.02));
    border-bottom: 1px solid rgba(102, 217, 255, 0.12);
  }

  tbody tr {
    transition: background 0.15s;
    &:hover { background: rgba(0, 184, 255, 0.06); }
    &.is-warning { background: rgba(248, 113, 113, 0.06); }
    &.st-not-started { opacity: 0.6; }
  }
}

.course-name {
  font-weight: 600;
  color: rgba(230, 246, 255, 0.92);
}

.td-num {
  font-family: 'DIN Alternate', sans-serif;
  font-weight: 600;
}

.td-sem {
  color: rgba(184, 236, 255, 0.7);
}

.req-tag {
  display: inline-block;
  font-size: var(--fs-tag);
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 600;

  &.required { color: #f87171; background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.28); }
  &.elective { color: #66d9ff; background: rgba(0, 184, 255, 0.08); border: 1px solid rgba(0, 212, 255, 0.22); }
}

.status-pill {
  display: inline-block;
  font-size: var(--fs-pill);
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 700;

  &.st-completed    { color: #34d399; background: rgba(52, 211, 153, 0.12); border: 1px solid rgba(52, 211, 153, 0.3); }
  &.st-in-progress  { color: #f0c040; background: rgba(240, 192, 64, 0.12); border: 1px solid rgba(240, 192, 64, 0.3); }
  &.st-not-started  { color: rgba(184, 236, 255, 0.55); background: rgba(184, 236, 255, 0.04); border: 1px solid rgba(184, 236, 255, 0.18); }
  &.st-failed       { color: #f87171; background: rgba(248, 113, 113, 0.12); border: 1px solid rgba(248, 113, 113, 0.3); }
}

.td-score {
  font-family: 'DIN Alternate', sans-serif;
  font-weight: 700;
  font-size: 17px;
  color: #f4f8ff;

  .muted { color: rgba(184, 236, 255, 0.3); font-weight: 400; }
  .fail-score { color: #f87171; }
}

.empty {
  text-align: center;
  color: rgba(184, 236, 255, 0.5);
  padding: 40px 0;
  font-size: 15px;
}
</style>
