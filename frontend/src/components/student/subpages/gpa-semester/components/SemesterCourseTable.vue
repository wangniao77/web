<script setup lang="ts">
/**
 * 学期课程明细表（独立页面版本）
 *
 * 在独立页面里表格会占满整个视口空间，因此：
 * - 表格不再限制 max-height，自由伸展
 * - 学期标签页默认激活最近一个学期
 * - 学期小结 6 个指标横排
 */
import { computed, ref, watch } from 'vue'
import type { CourseRecordVM, SemesterSummaryVM } from '../../_shared/gpa-data'
import { CATEGORY_COLOR } from '../../_shared/gpa-data'

const props = defineProps<{
  semesters: SemesterSummaryVM[]
  courses: CourseRecordVM[]
  /** 默认激活的学期索引（从 0 开始，0=最早） */
  defaultIndex?: number
}>()

type SortKey = 'score' | 'credit' | 'name'
type SortDir = 'asc' | 'desc'

const activeIndex = ref(Math.max(0, props.semesters.length - 1 - (props.defaultIndex ?? 0)))
const sortKey = ref<SortKey>('score')
const sortDir = ref<SortDir>('desc')

const activeSemester = computed(() => props.semesters[activeIndex.value])

const semesterCourses = computed(() => {
  if (!activeSemester.value) return []
  const sem = activeSemester.value.semester
  return props.courses
    .filter((c) => c.semester === sem)
    .slice()
    .sort((a, b) => {
      let cmp = 0
      if (sortKey.value === 'score')  cmp = a.score - b.score
      if (sortKey.value === 'credit') cmp = a.credit - b.credit
      if (sortKey.value === 'name')   cmp = a.name.localeCompare(b.name, 'zh')
      return sortDir.value === 'asc' ? cmp : -cmp
    })
})

function setSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'name' ? 'asc' : 'desc'
  }
}

function sortIcon(key: SortKey): string {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? '↑' : '↓'
}

// 切换学期时自动重置排序为按成绩降序
watch(activeIndex, () => {
  sortKey.value = 'score'
  sortDir.value = 'desc'
})
</script>

<template>
  <div class="semester-table">
    <header class="table-head">
      <span class="table-bar" aria-hidden="true" />
      <h3 class="table-title">每学期已修课程明细</h3>
      <span class="table-sub">点击表头切换排序</span>
    </header>

    <!-- 学期标签页 -->
    <div class="tabs">
      <button
        v-for="(s, i) in semesters"
        :key="s.semester"
        type="button"
        class="tab"
        :class="{ active: i === activeIndex }"
        @click="activeIndex = i"
      >
        <span class="tab-name">{{ s.semester }}</span>
        <span class="tab-stat">
          <span class="tab-gpa">GPA {{ s.gpa.toFixed(2) }}</span>
          <span class="tab-credit">{{ s.totalCredits }} 学分</span>
        </span>
      </button>
    </div>

    <!-- 学期小结 -->
    <div v-if="activeSemester" class="semester-summary">
      <div class="summary-item">
        <span class="sum-label">学期 GPA</span>
        <span class="sum-val primary">{{ activeSemester.gpa.toFixed(2) }}</span>
      </div>
      <div class="summary-item">
        <span class="sum-label">加权均分</span>
        <span class="sum-val">{{ activeSemester.averageScore }}</span>
      </div>
      <div class="summary-item">
        <span class="sum-label">修读课程</span>
        <span class="sum-val">{{ activeSemester.totalCourses }}<small>门</small></span>
      </div>
      <div class="summary-item">
        <span class="sum-label">获得学分</span>
        <span class="sum-val">{{ activeSemester.totalCredits }}</span>
      </div>
      <div class="summary-item">
        <span class="sum-label">优秀课程</span>
        <span class="sum-val good">{{ activeSemester.excellentCourses }}<small>门 · 优率 {{ activeSemester.excellentRate }}%</small></span>
      </div>
      <div class="summary-item">
        <span class="sum-label">不及格</span>
        <span class="sum-val" :class="{ bad: activeSemester.failCourses > 0 }">
          {{ activeSemester.failCourses }}<small>门</small>
        </span>
      </div>
    </div>

    <!-- 课程表：占满剩余空间 -->
    <div class="table-wrap">
      <table class="course-table">
        <thead>
          <tr>
            <th class="th-name" @click="setSort('name')">
              课程名称 <span class="sort-mark">{{ sortIcon('name') }}</span>
            </th>
            <th class="th-cat">类别</th>
            <th class="th-credit sortable" @click="setSort('credit')">
              学分 <span class="sort-mark">{{ sortIcon('credit') }}</span>
            </th>
            <th class="th-score sortable" @click="setSort('score')">
              成绩 <span class="sort-mark">{{ sortIcon('score') }}</span>
            </th>
            <th class="th-gpa">绩点</th>
            <th class="th-wp">加权贡献</th>
            <th class="th-level">等级</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in semesterCourses" :key="c.id" :class="{ 'is-uncounted': !c.counted, 'is-warning': c.warning }">
            <td class="td-name">
              <span class="course-name">{{ c.name }}</span>
              <span v-if="!c.counted" class="badge-uncounted" title="不计入 GPA">不计入</span>
            </td>
            <td>
              <span class="cat-tag" :style="{ color: CATEGORY_COLOR[c.category], borderColor: CATEGORY_COLOR[c.category] + '55', background: CATEGORY_COLOR[c.category] + '14' }">
                {{ c.categoryLabel }}
              </span>
            </td>
            <td class="td-num">{{ c.credit }}</td>
            <td class="td-score" :class="`lv-${c.level}`">{{ c.score }}</td>
            <td class="td-num">{{ c.gpaPoint.toFixed(2) }}</td>
            <td class="td-num">{{ c.weightedPoint.toFixed(2) }}</td>
            <td>
              <span class="level-tag" :class="`lv-${c.level}`">{{ c.levelLabel }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.semester-table {
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
  padding: 18px 22px 16px;
  height: 100%;
  min-height: 0;
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
}

.table-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.table-bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00e5ff, #00b8ff);
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.5);
  flex-shrink: 0;
}

.table-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #f4fbff;
  text-shadow: 0 0 12px rgba(0, 242, 255, 0.28);
  letter-spacing: 0.04em;
}

.table-sub {
  margin-left: auto;
  font-size: 13px;
  color: rgba(184, 236, 255, 0.55);
  letter-spacing: 0.02em;
}

/* ── 标签页 ────────────────────────────────────────── */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.tab {
  flex: 1 1 auto;
  min-width: 130px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 10px 16px;
  border-radius: 6px;
  background: rgba(0, 184, 255, 0.04);
  border: 1px solid rgba(0, 184, 255, 0.12);
  color: rgba(184, 236, 255, 0.7);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;

  &:hover {
    background: rgba(0, 184, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
    color: #f0f6ff;
  }

  &.active {
    background:
      linear-gradient(180deg, rgba(0, 184, 255, 0.22), rgba(4, 18, 48, 0.5)),
      rgba(0, 184, 255, 0.12);
    border-color: rgba(0, 212, 255, 0.5);
    color: #ffffff;
    box-shadow: 0 0 14px rgba(0, 184, 255, 0.2), inset 0 0 10px rgba(0, 212, 255, 0.12);
  }
}

.tab-name {
  font-size: 18px;
  font-weight: 700;
}

.tab-stat {
  font-size: 12px;
  color: rgba(184, 236, 255, 0.6);
  display: flex;
  gap: 8px;
}

.tab.active .tab-stat { color: #9eefff; }
.tab-gpa { color: #f0c040; font-weight: 600; }

/* ── 学期小结 ────────────────────────────────────────── */
.semester-summary {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 14px;
  border-radius: 6px;
  background: rgba(0, 184, 255, 0.04);
  border: 1px solid rgba(0, 212, 255, 0.1);
  flex-shrink: 0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.sum-label {
  font-size: 12px;
  color: rgba(184, 236, 255, 0.6);
  letter-spacing: 0.04em;
}

.sum-val {
  font-family: 'DIN Alternate', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #f4f8ff;
  line-height: 1.1;

  small {
    font-size: 12px;
    color: rgba(184, 236, 255, 0.55);
    font-weight: 400;
    font-family: inherit;
  }

  &.primary { color: #f0c040; text-shadow: 0 0 10px rgba(240, 192, 64, 0.3); }
  &.good { color: #34d399; }
  &.bad  { color: #f87171; }
}

/* ── 表格：占满剩余空间 ────────────────────────────────── */
.table-wrap {
  flex: 1;
  min-height: 320px;
  overflow: auto;
  border: 1px solid rgba(102, 217, 255, 0.1);
  border-radius: 6px;
  background: rgba(2, 10, 30, 0.36);

  &::-webkit-scrollbar { width: 8px; height: 8px; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 184, 255, 0.3); border-radius: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
}

.course-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th, td {
    padding: 12px 14px;
    text-align: left;
    border-bottom: 1px solid rgba(102, 217, 255, 0.08);
    white-space: nowrap;
  }

  thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    color: #a8f0ff;
    font-weight: 800;
    font-size: 13px;
    letter-spacing: 0.04em;
    background:
      linear-gradient(90deg, rgba(0, 184, 255, 0.16), rgba(0, 184, 255, 0.04)),
      rgba(4, 18, 48, 0.92);
    backdrop-filter: blur(4px);
    padding: 14px;

    &.sortable {
      cursor: pointer;
      user-select: none;
      transition: color 0.2s;

      &:hover { color: #ffffff; }
    }
  }

  .sort-mark {
    color: #f0c040;
    margin-left: 2px;
    font-weight: 800;
  }

  tbody tr {
    transition: background 0.15s;
    &:hover { background: rgba(0, 184, 255, 0.08); }
    &.is-uncounted { opacity: 0.55; }
    &.is-warning td.td-score { color: #f87171; }
  }

  td.td-num {
    font-family: 'DIN Alternate', sans-serif;
    font-weight: 600;
  }

  td.td-score {
    font-family: 'DIN Alternate', sans-serif;
    font-weight: 800;
    font-size: 18px;

    &.lv-excellent { color: #34d399; text-shadow: 0 0 6px rgba(52, 211, 153, 0.3); }
    &.lv-good      { color: #66d9ff; }
    &.lv-medium    { color: #f0c040; }
    &.lv-pass      { color: #fb923c; }
    &.lv-fail      { color: #f87171; }
  }
}

.course-name {
  font-weight: 600;
  font-size: 14px;
  color: rgba(230, 246, 255, 0.92);
}

.badge-uncounted {
  margin-left: 6px;
  font-size: 11px;
  padding: 0 5px;
  border-radius: 3px;
  background: rgba(184, 236, 255, 0.08);
  color: rgba(184, 236, 255, 0.6);
  font-weight: 500;
}

.cat-tag {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid;
  white-space: nowrap;
}

.level-tag {
  display: inline-block;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 700;

  &.lv-excellent { color: #34d399; background: rgba(52, 211, 153, 0.12); border: 1px solid rgba(52, 211, 153, 0.3); }
  &.lv-good      { color: #66d9ff; background: rgba(0, 184, 255, 0.12);  border: 1px solid rgba(0, 212, 255, 0.3); }
  &.lv-medium    { color: #f0c040; background: rgba(240, 192, 64, 0.12);  border: 1px solid rgba(240, 192, 64, 0.3); }
  &.lv-pass      { color: #fb923c; background: rgba(251, 146, 60, 0.12);  border: 1px solid rgba(251, 146, 60, 0.3); }
  &.lv-fail      { color: #f87171; background: rgba(248, 113, 113, 0.12); border: 1px solid rgba(248, 113, 113, 0.3); }
}
</style>
