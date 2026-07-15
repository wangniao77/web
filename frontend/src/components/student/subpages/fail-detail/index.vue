<script setup lang="ts">
/**
 * 学生端挂科详情页
 *
 * 路由：/student/fail-detail
 * 入口：一级页面学情轨迹护航卡片中点击「挂科 X 门」按钮进入
 *
 * 内容：
 * 1. KPI 摘要（挂科数 / 涉及学期 / 平均分 / 主要挂科类别）
 * 2. 归因分类（学生个人问题 vs 课程普遍问题 vs 混合）
 * 3. 每学期挂科课程明细（表格 + 与班均对比）
 * 4. 问题分析总结
 */
import { computed, onMounted, ref } from 'vue'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import { failDetailService } from '../_shared/fail-data'
import type { FailDetailVM } from '../_shared/fail-data'

const data = ref<FailDetailVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await failDetailService.fetchDetail()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

type RiskTab = 'all' | 'student' | 'course' | 'mixed'
const riskTab = ref<RiskTab>('all')

const FILTER_LABEL: Record<RiskTab, string> = {
  all: '全部挂科',
  student: '学生个人原因',
  course: '课程普遍偏难',
  mixed: '混合原因',
}

const filteredCourses = computed(() => {
  if (!data.value) return []
  if (riskTab.value === 'student') return data.value.studentSide
  if (riskTab.value === 'course') return data.value.courseSide
  if (riskTab.value === 'mixed') return data.value.courses.filter(c => c.riskLevel === 'mixed')
  return data.value.courses
})

const filteredSemesters = computed(() => {
  if (!data.value) return []
  if (riskTab.value === 'all') return data.value.semesters
  return data.value.semesters
    .map(sg => ({
      ...sg,
      courses: sg.courses.filter(c => c.riskLevel === riskTab.value),
    }))
    .filter(sg => sg.courses.length)
    .map(sg => ({
      ...sg,
      avgScore: Math.round(sg.courses.reduce((s, c) => s + c.score, 0) / sg.courses.length),
    }))
})


const overallRisk = computed(() => {
  if (!data.value) return { label: '—', color: '#94a3b8' }
  const ov = data.value.overview
  if (ov.totalFailed >= 5) return { label: '需重点干预', color: '#f87171' }
  if (ov.totalFailed >= 3) return { label: '需持续关注', color: '#fb923c' }
  return { label: '轻度挂科', color: '#facc15' }
})

const riskDistribution = computed(() => {
  if (!data.value) return []
  const ov = data.value.overview
  const total = ov.studentIssueCount + ov.courseIssueCount + ov.mixedIssueCount || 1
  return [
    { label: '学生个人原因', count: ov.studentIssueCount, pct: Math.round(ov.studentIssueCount / total * 100), color: '#fb923c' },
    { label: '课程普遍偏难', count: ov.courseIssueCount, pct: Math.round(ov.courseIssueCount / total * 100), color: '#60a5fa' },
    { label: '综合因素', count: ov.mixedIssueCount, pct: Math.round(ov.mixedIssueCount / total * 100), color: '#a78bfa' },
  ]
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="挂科课程详情"
    subtitle="挂科明细 · 班均对比 · 归因分析"
    back-text="← 返回学生档案"
  >
    <div v-if="loading" class="placeholder">
      <span class="spinner" /> 正在加载挂科数据...
    </div>

    <div v-else-if="error" class="placeholder error">
      <span>{{ error }}</span>
      <button type="button" @click="load">重试</button>
    </div>

    <div v-else-if="data" class="fail-detail">
      <!-- ═══ KPI 摘要 ═══ -->
      <section class="kpi-row">
        <div class="kpi-card">
          <span class="kpi-label">挂科总数</span>
          <span class="kpi-value" :style="{ color: overallRisk.color }">
            {{ data.overview.totalFailed }}<small>门</small>
          </span>
          <span class="kpi-tag" :class="`tag-${data.overview.totalFailed >= 5 ? 'high' : data.overview.totalFailed >= 3 ? 'mid' : 'low'}`">
            {{ overallRisk.label }}
          </span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">涉及学期</span>
          <span class="kpi-value">{{ data.overview.affectedSemesters }}<small>个</small></span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">挂科平均分</span>
          <span class="kpi-value">{{ data.overview.avgFailScore }}<small>分</small></span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">主要挂科类别</span>
          <span class="kpi-value kpi-value--sm">{{ data.overview.mostProblemCategory }}</span>
        </div>
      </section>

      <!-- ═══ 归因分布 ═══ -->
      <section class="risk-bar">
        <h4 class="section-title">挂科原因分布</h4>
        <div class="risk-chips">
          <button
            v-for="tab in (['all', 'student', 'course', 'mixed'] as const)"
            :key="tab"
            type="button"
            class="risk-chip"
            :class="{ active: riskTab === tab }"
            :style="tab !== 'all' ? { '--chip-color': tab === 'student' ? '#fb923c' : tab === 'course' ? '#60a5fa' : '#a78bfa' } : {}"
            @click="riskTab = tab"
          >
            {{ FILTER_LABEL[tab] }}
            <em v-if="tab !== 'all'">
              ({{ tab === 'student' ? data.overview.studentIssueCount : tab === 'course' ? data.overview.courseIssueCount : data.overview.mixedIssueCount }})
            </em>
          </button>
        </div>
        <div class="risk-bar-chart">
          <div
            v-for="item in riskDistribution"
            :key="item.label"
            class="risk-bar-chart__seg"
            :style="{ width: item.pct + '%', background: item.color }"
          >
            <span class="risk-bar-chart__label">{{ item.label }} {{ item.count }}门</span>
          </div>
        </div>
      </section>

      <!-- ═══ 每学期挂科课程明细 ═══ -->
      <section class="fail-table-wrap">
        <h4 class="section-title">每学期挂科课程明细</h4>
        <div v-for="sg in filteredSemesters" :key="sg.semesterIndex" class="semester-block">
          <div class="semester-header">
            <span class="semester-name">{{ sg.semester }}</span>
            <span class="semester-badge">挂科 {{ sg.courses.length }} 门</span>
            <span class="semester-badge muted">平均 {{ sg.avgScore }} 分</span>
          </div>

          <div class="table-scroll">
            <table class="fail-table">
              <thead>
                <tr>
                  <th>课程名称</th>
                  <th>类别</th>
                  <th>学分</th>
                  <th class="col-num">得分</th>
                  <th class="col-num">班均分</th>
                  <th class="col-num">差距</th>
                  <th class="col-num">班挂科率</th>
                  <th>授课教师</th>
                  <th class="col-tag">严重程度</th>
                  <th>归因</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="c in sg.courses"
                  :key="c.id"
                  :class="{ 'row--student': c.riskLevel === 'student', 'row--course': c.riskLevel === 'course', 'row--mixed': c.riskLevel === 'mixed' }"
                >
                  <td class="col-name">
                    <strong>{{ c.name }}</strong>
                  </td>
                  <td><span class="cat-tag">{{ c.categoryLabel }}</span></td>
                  <td class="col-num">{{ c.credit }}</td>
                  <td class="col-num score-fail">{{ c.score }}</td>
                  <td class="col-num">{{ c.classAvg }}</td>
                  <td class="col-num" :class="{ 'gap-bad': c.gapFromAvg >= 15 }">
                    −{{ c.gapFromAvg }}
                  </td>
                  <td class="col-num" :class="{ 'rate-high': c.classFailRate >= 30 }">
                    {{ c.classFailRate }}% <small>({{ c.classFailCount }}/{{ c.classTotal }})</small>
                  </td>
                  <td>{{ c.teacher }}</td>
                  <td class="col-tag">
                    <span class="sev-tag" :class="`sev--${c.severityLabel}`">{{ c.severityLabel }}</span>
                  </td>
                  <td>
                    <span
                      class="risk-badge"
                      :class="`risk--${c.riskLevel}`"
                    >
                      {{ c.riskLevel === 'student' ? '学生侧' : c.riskLevel === 'course' ? '课程侧' : '混合' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ═══ 问题分析与建议 ═══ -->
      <section class="analysis-section">
        <h4 class="section-title">问题分析与建议</h4>
        <div class="analysis-grid">
          <div
            v-for="c in filteredCourses"
            :key="'a-' + c.id"
            class="analysis-card"
            :class="`an--${c.riskLevel}`"
          >
            <div class="an-header">
              <span class="an-name">{{ c.name }}</span>
              <span class="an-score">{{ c.score }} 分</span>
            </div>
            <p class="an-text">{{ c.analysis }}</p>
            <div class="an-footer">
              <span class="an-teacher">授课：{{ c.teacher }}</span>
              <span class="an-avg">班均 {{ c.classAvg }} · 挂科率 {{ c.classFailRate }}%</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.fail-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ═══ KPI Row ═══ */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.kpi-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 102px;
  padding: 16px 12px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.7), rgba(5, 17, 45, 0.62)),
    rgba(6, 17, 52, 0.42);
  border: 1px solid rgba(102, 217, 255, 0.14);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22), inset 0 0 18px rgba(0, 184, 255, 0.04);
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

.kpi-label {
  font-size: 13px;
  color: rgba(190, 210, 238, 0.8);
  letter-spacing: 0.04em;
}

.kpi-value {
  font-family: 'DIN Alternate', 'Bahnschrift', 'Roboto Condensed', 'Arial Narrow', sans-serif;
  font-size: 30px;
  font-weight: 700;
  color: #f4f8ff;
  line-height: 1.1;
  text-shadow: 0 1px 2px rgba(0, 10, 30, 0.9), 0 0 12px rgba(57, 230, 255, 0.42);

  small {
    font-size: 13px;
    color: rgba(186, 208, 236, 0.7);
    font-weight: 400;
    margin-left: 2px;
  }

  &--sm {
    font-size: 20px;
  }
}

.kpi-tag {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid;
  font-weight: 600;
  letter-spacing: 0.04em;

  &.tag-high { color: #f87171; background: rgba(248, 113, 113, 0.12); border-color: rgba(248, 113, 113, 0.3); }
  &.tag-mid  { color: #fb923c; background: rgba(251, 146, 60, 0.12); border-color: rgba(251, 146, 60, 0.3); }
  &.tag-low  { color: #facc15; background: rgba(250, 204, 21, 0.12); border-color: rgba(250, 204, 21, 0.3); }
}

/* ═══ Section ═══ */
.section-title {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 700;
  color: #b8ecff;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '';
    width: 3px;
    height: 16px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.45);
  }
}

/* ═══ Risk Bar ═══ */
.risk-bar {
  padding: 16px 18px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
}

.risk-chips {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.risk-chip {
  padding: 5px 14px;
  border: 1px solid rgba(102, 217, 255, 0.2);
  border-radius: 999px;
  background: rgba(0, 184, 255, 0.06);
  color: rgba(184, 236, 255, 0.8);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  em { font-style: normal; opacity: 0.7; margin-left: 2px; }

  &:hover {
    border-color: rgba(0, 212, 255, 0.4);
    color: #b8ecff;
  }

  &.active {
    border-color: rgba(0, 212, 255, 0.55);
    background: rgba(0, 184, 255, 0.15);
    color: #fff;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.15);
  }
}

.risk-bar-chart {
  display: flex;
  height: 28px;
  border-radius: 6px;
  overflow: hidden;
  gap: 2px;
  background: rgba(0, 0, 0, 0.2);
}

.risk-bar-chart__seg {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  transition: width 0.3s;
}

.risk-bar-chart__label {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 8px;
}

/* ═══ Fail Table ═══ */
.fail-table-wrap {
  padding: 16px 18px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
}

.semester-block {
  &:not(:last-child) {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.08);
  }
}

.semester-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.semester-name {
  font-size: 15px;
  font-weight: 700;
  color: #7ff6ff;
}

.semester-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(248, 113, 113, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: #f87171;
  font-weight: 600;

  &.muted {
    background: rgba(148, 163, 184, 0.1);
    border-color: rgba(148, 163, 184, 0.2);
    color: #94a3b8;
  }
}

.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 184, 255, 0.2); border-radius: 2px; }
}

.fail-table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
  font-size: 13px;
  color: rgba(184, 236, 255, 0.85);

  th {
    text-align: center;
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 700;
    color: #9ecae8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-bottom: 1px solid rgba(102, 217, 255, 0.14);
    white-space: nowrap;
  }

  td {
    text-align: center;
    padding: 9px 10px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.06);
    white-space: nowrap;
  }

  tbody tr {
    transition: background 0.15s;

    &:hover { background: rgba(0, 184, 255, 0.06); }
  }

  .col-num { font-family: 'DIN Alternate', sans-serif; font-weight: 700; }
  .col-name { min-width: 150px; white-space: normal; }

  .score-fail { color: #f87171; font-size: 15px; }
  .gap-bad { color: #f87171; }
  .rate-high { color: #fbbf24; }

  small { font-size: 11px; color: rgba(148, 163, 184, 0.7); font-weight: 400; }
}

.cat-tag {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.15);
  color: #8ef6ff;
}

.sev-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 700;

  &.sev--严重 { background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
  &.sev--较重 { background: rgba(251, 146, 60, 0.15); color: #fb923c; border: 1px solid rgba(251, 146, 60, 0.3); }
  &.sev--临界 { background: rgba(250, 204, 21, 0.15); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.3); }
  &.sev--擦边 { background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2); }
}

.risk-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 700;

  &.risk--student { background: rgba(251, 146, 60, 0.15); color: #fb923c; border: 1px solid rgba(251, 146, 60, 0.3); }
  &.risk--course  { background: rgba(96, 165, 250, 0.15); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3); }
  &.risk--mixed   { background: rgba(167, 139, 250, 0.15); color: #a78bfa; border: 1px solid rgba(167, 139, 250, 0.3); }
}

/* ═══ Analysis ═══ */
.analysis-section {
  padding: 16px 18px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
}

.analysis-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.analysis-card {
  padding: 14px 16px;
  border-radius: 6px;
  border-left: 4px solid;
  background: rgba(6, 17, 52, 0.4);

  &.an--student { border-color: #fb923c; }
  &.an--course  { border-color: #60a5fa; }
  &.an--mixed   { border-color: #a78bfa; }
}

.an-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.an-name {
  font-size: 14px;
  font-weight: 700;
  color: #f4fbff;
}

.an-score {
  font-family: 'DIN Alternate', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #f87171;
}

.an-text {
  margin: 0 0 8px;
  font-size: 13px;
  color: rgba(184, 236, 255, 0.75);
  line-height: 1.5;
}

.an-footer {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: rgba(148, 163, 184, 0.7);
}

/* ═══ Placeholder ═══ */
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 320px;
  font-size: 15px;
  color: rgba(184, 236, 255, 0.7);
  border: 1px solid rgba(102, 217, 255, 0.12);
  border-radius: 8px;
  background: rgba(4, 14, 38, 0.38);

  &.error { color: #f87171; }

  button {
    padding: 4px 14px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.3);
    background: rgba(0, 184, 255, 0.1);
    color: #55dfff;
    cursor: pointer;
    font-size: 13px;

    &:hover { background: rgba(0, 184, 255, 0.2); }
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #00b8ff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ═══ Responsive ═══ */
@media (max-width: 1280px) {
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
  .analysis-grid { grid-template-columns: 1fr; }
}
</style>
