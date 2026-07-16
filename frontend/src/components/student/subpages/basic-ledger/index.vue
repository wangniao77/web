<script setup lang="ts">
/**
 * 学生基础信息台账详情页（二级页面）
 *
 * 路由：/student/basic-ledger
 * 入口：一级页面左侧「学生基础信息台账」卡片中点击「基础信息台账 ›」按钮
 *
 * 内容：学籍档案全量 + 管理与帮扶状态 + 家庭信息 + 预警信息详细展示
 * 不放学期课表
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM, AttentionItemVM } from '@/types/student/view'

const route = useRoute()
const router = useRouter()
const { studentScope } = useScope()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || studentScope.value.studentId,
)

const dashboard = ref<StudentDashboardVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    dashboard.value = await studentService.fetchDashboard(activeStudentId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

type RiskLevel = 'low' | 'medium' | 'high'
const riskWeight: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 }
const riskText: Record<RiskLevel, string> = { low: '正常', medium: '需关注', high: '高危' }

function highestLevel(pattern: RegExp, items: AttentionItemVM[]): RiskLevel {
  return items
    .filter((item) => pattern.test(`${item.category}${item.label}`))
    .reduce<RiskLevel>((highest, item) => (
      riskWeight[item.level] > riskWeight[highest] ? item.level : highest
    ), 'low')
}

function detailFor(pattern: RegExp, items: AttentionItemVM[], fallback: string) {
  const hit = items.find((item) => pattern.test(`${item.category}${item.label}`))
  return hit?.label || fallback
}

const warningCards = computed(() => {
  if (!dashboard.value) return []
  const items = dashboard.value.attention
  const psychological = dashboard.value.profile.mentalLevelCode ?? highestLevel(/心理|健康|体测/, items)
  const academic = highestLevel(/学业|课程|挂科|GPA|补考/, items)
  const employment = highestLevel(/就业|实习|职业/, items)

  return [
    {
      label: '心理预警',
      level: psychological,
      conclusion: dashboard.value.profile.mentalLevel || riskText[psychological],
      tip: `反映心理关注侧风险（绿=正常，黄=需关注，红=高危）。${detailFor(/心理|健康|体测/, items, '当前结论见下方文字')}`,
      items: items.filter((i) => /心理|健康|体测/.test(`${i.category}${i.label}`)),
    },
    {
      label: '学业预警',
      level: academic,
      conclusion: riskText[academic],
      tip: `反映挂科、GPA 等学业风险（绿=正常，黄=需关注，红=高危）。${detailFor(/学业|课程|挂科|GPA|补考/, items, academic === 'low' ? '无挂科，仅需完成常规期末考核' : '请查看预警台账与补考安排')}`,
      items: items.filter((i) => /学业|课程|挂科|GPA|补考/.test(`${i.category}${i.label}`)),
    },
    {
      label: '就业预警',
      level: employment,
      conclusion: riskText[employment],
      tip: `反映实习就业准备不足风险（绿=正常，黄=需关注，红=高危）。${detailFor(/就业|实习|职业/, items, employment === 'low' ? '就业填报待完善，暂无高危信号' : '关注实习与岗位匹配短板')}`,
      items: items.filter((i) => /就业|实习|职业/.test(`${i.category}${i.label}`)),
    },
  ]
})

const allAttention = computed(() => {
  if (!dashboard.value) return []
  return dashboard.value.attention
})

function goWarningDetail(label: string) {
  const map: Record<string, string> = {
    '心理预警': 'student-psy-warning',
    '学业预警': 'student-academic-warning',
    '就业预警': 'student-employment-warning',
  }
  const name = map[label]
  if (name) {
    router.push({ name, query: { studentId: activeStudentId.value } })
  }
}

const levelColor = (level: RiskLevel) => ({
  low: '#55e995',
  medium: '#facc15',
  high: '#ff7474',
}[level])

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="学生基础信息台账"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId} · ${dashboard.profile.className}` : ''"
    back-text="← 返回学生档案"
    :back-to="{ name: 'student', query: { studentId: activeStudentId } }"
    mock-badge="模拟数据"
  >
    <div v-if="loading" class="placeholder">
      <span class="spinner" /> 正在加载学生档案...
    </div>

    <div v-else-if="error" class="placeholder error">
      <span>{{ error }}</span>
      <button type="button" @click="load">重试</button>
    </div>

    <div v-else-if="dashboard" class="basic-ledger">
      <!-- ═══ 一、学籍与家庭信息 ═══ -->
      <section class="ledger-section">
        <h3 class="section-title">学籍与家庭信息<span class="section-mock-tag">部分模拟</span></h3>
        <div class="info-table">
          <div class="info-row">
            <div class="info-cell"><span class="info-lbl">姓名</span><span class="info-val">{{ dashboard.profile.name }}</span></div>
            <div class="info-cell"><span class="info-lbl">性别</span><span class="info-val">{{ dashboard.profile.gender || '男' }}</span></div>
          </div>
          <div class="info-row">
            <div class="info-cell"><span class="info-lbl">学号</span><span class="info-val">{{ dashboard.profile.studentId }}</span></div>
            <div class="info-cell"><span class="info-lbl">班级</span><span class="info-val">{{ dashboard.profile.className }}</span></div>
          </div>
          <div class="info-row">
            <div class="info-cell"><span class="info-lbl">专业</span><span class="info-val">{{ dashboard.profile.major }}</span></div>
            <div class="info-cell"><span class="info-lbl">学院</span><span class="info-val">{{ dashboard.profile.college }}</span></div>
          </div>
          <div class="info-row">
            <div class="info-cell"><span class="info-lbl">年级</span><span class="info-val">{{ dashboard.profile.grade }}</span></div>
            <div class="info-cell"><span class="info-lbl">政治面貌</span><span class="info-val">{{ dashboard.profile.politicalStatus || '—' }}</span></div>
          </div>
          <div class="info-row">
            <div class="info-cell"><span class="info-lbl">宿舍</span><span class="info-val">{{ dashboard.profile.dormitory || '—' }}</span></div>
            <div class="info-cell"><span class="info-lbl">辅导员</span><span class="info-val">{{ dashboard.profile.counselor || '—' }}</span></div>
          </div>
          <div class="info-row">
            <div class="info-cell"><span class="info-lbl">班主任</span><span class="info-val">{{ dashboard.profile.mentor || '—' }}</span></div>
            <div class="info-cell"><span class="info-lbl">联系电话</span><span class="info-val">{{ dashboard.profile.phone || '—' }}</span></div>
          </div>
          <div class="info-row" v-if="dashboard.profile.classCadreRole || dashboard.profile.highPotentialTags?.length">
            <div class="info-cell" v-if="dashboard.profile.classCadreRole">
              <span class="info-lbl">班干部职务</span>
              <span class="info-val info-val--tag">{{ dashboard.profile.classCadreRole }}</span>
            </div>
            <div class="info-cell" v-if="dashboard.profile.highPotentialTags?.length">
              <span class="info-lbl">高潜标签</span>
              <span class="info-tags">
                <span v-for="tag in dashboard.profile.highPotentialTags" :key="tag" class="tag tag--potential">{{ tag }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="info-section-divider" />

        <div class="info-table">
          <div class="info-row">
            <div class="info-cell info-cell--wide"><span class="info-lbl">家庭住址</span><span class="info-val">{{ dashboard.profile.address || '—' }}</span></div>
          </div>
          <div class="info-row">
            <div class="info-cell"><span class="info-lbl">家长姓名</span><span class="info-val">{{ dashboard.profile.guardianName || '—' }}</span></div>
            <div class="info-cell"><span class="info-lbl">家长联系方式</span><span class="info-val">{{ dashboard.profile.guardianPhone || '—' }}</span></div>
          </div>
          <div class="info-row">
            <div class="info-cell info-cell--wide"><span class="info-lbl">家庭成员</span><span class="info-val">{{ dashboard.profile.familyMembers?.join('、') || '暂无记录' }}</span></div>
          </div>
          <div class="info-row">
            <div class="info-cell"><span class="info-lbl">家庭经济情况</span><span class="info-val">{{ dashboard.profile.economicHardship ? '困难认定' : '一般' }}</span></div>
            <div class="info-cell"></div>
          </div>
        </div>
        <div class="info-note" v-if="dashboard.profile.familySituation">
          <span class="info-note__label">家庭情况备注：</span>
          {{ dashboard.profile.familySituation }}
        </div>
        <div class="info-note" v-if="dashboard.profile.difficultyDetail">
          <span class="info-note__label">详细困难情况：</span>
          {{ dashboard.profile.difficultyDetail }}
        </div>
      </section>

      <!-- ═══ 二、管理与帮扶状态 ═══ -->
      <section class="ledger-section">
        <h3 class="section-title">管理与帮扶状态<span class="section-mock-tag">部分模拟</span></h3>
        <div class="status-grid">
          <div class="status-card status-card--safe">
            <span class="status-card__label">学籍状态</span>
            <strong class="status-card__value">{{ dashboard.profile.onCampusStatus || '在校' }}</strong>
          </div>
          <div
            class="status-card"
            :class="dashboard.profile.economicHardship ? 'status-card--warn' : 'status-card--safe'"
          >
            <span class="status-card__label">困难认定</span>
            <strong class="status-card__value">{{ dashboard.profile.economicHardship ? '已认定' : '未认定' }}</strong>
          </div>
          <div
            class="status-card"
            :class="dashboard.profile.mentalLevelCode === 'high' ? 'status-card--risk' : dashboard.profile.mentalLevelCode === 'medium' ? 'status-card--warn' : 'status-card--safe'"
          >
            <span class="status-card__label">心理分级</span>
            <strong class="status-card__value">{{ dashboard.profile.mentalLevel || '正常' }}</strong>
          </div>
          <div
            class="status-card"
            :class="dashboard.profile.growthTrend === 'negative' ? 'status-card--risk' : 'status-card--safe'"
          >
            <span class="status-card__label">成长趋势</span>
            <strong class="status-card__value">{{
              { positive: '正向上升', negative: '负向波动', stable: '总体平稳' }[dashboard.profile.growthTrend ?? 'stable']
            }}</strong>
          </div>
          <div class="status-card status-card--info">
            <span class="status-card__label">征兵状态</span>
            <strong class="status-card__value">{{ dashboard.careerDev.militaryNote || '无' }}</strong>
          </div>
        </div>
      </section>

      <!-- ═══ 三、近期动态 ═══ -->
      <section class="ledger-section" v-if="dashboard.profile.recentDynamics?.length">
        <h3 class="section-title">近期动态<span class="section-mock-tag">部分模拟</span></h3>
        <div class="dynamic-list">
          <div
            v-for="(d, idx) in dashboard.profile.recentDynamics"
            :key="idx"
            class="dynamic-item"
            :class="`dynamic-item--${d.kind}`"
          >
            <span class="dynamic-time">{{ d.time }}</span>
            <span class="dynamic-text">{{ d.text }}</span>
          </div>
        </div>
      </section>

      <!-- ═══ 四、预警信息详细展示 ═══ -->
      <section class="ledger-section">
        <h3 class="section-title">预警信息<span class="section-mock-tag">部分模拟</span></h3>

        <!-- 4.1 预警总览 -->
        <div class="warning-summary">
          <div
            v-for="card in warningCards"
            :key="card.label"
            class="warning-card warning-card--clickable"
            :class="`warning-card--${card.level}`"
            @click="goWarningDetail(card.label)"
          >
            <div class="warning-card__head">
              <span class="warning-card__dot" :style="{ background: levelColor(card.level), boxShadow: `0 0 10px ${levelColor(card.level)}` }" />
              <span class="warning-card__label">{{ card.label }}</span>
              <span class="warning-card__level" :style="{ color: levelColor(card.level) }">{{ card.conclusion }}</span>
            </div>
            <p class="warning-card__tip">{{ card.tip }}<span class="warning-card__link">点击查看详情 &rsaquo;</span></p>
            <div class="warning-card__items" v-if="card.items.length">
              <div
                v-for="item in card.items"
                :key="item.id"
                class="warning-card__item"
                :class="`warning-card__item--${item.level}`"
              >
                <span class="warning-card__item-dot" :style="{ background: levelColor(item.level) }" />
                <span class="warning-card__item-category">[{{ item.category }}]</span>
                <span class="warning-card__item-label">{{ item.label }}</span>
                <span class="warning-card__item-level" :style="{ color: levelColor(item.level) }">{{ item.levelLabel }}</span>
              </div>
            </div>
            <div class="warning-card__empty" v-else>
              暂无此类预警项
            </div>
          </div>
        </div>

        <!-- 4.2 全部预警项详细列表 -->
        <div class="warning-detail-table" v-if="allAttention.length">
          <h4 class="subsection-title">预警台账明细</h4>
          <div class="table-wrap">
            <table class="warning-table">
              <thead>
                <tr>
                  <th>分类</th>
                  <th>预警项</th>
                  <th>风险等级</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in allAttention"
                  :key="item.id"
                  :class="`row--${item.level}`"
                >
                  <td>
                    <span class="cat-badge">{{ item.category }}</span>
                  </td>
                  <td class="cell-label">{{ item.label }}</td>
                  <td>
                    <span class="level-badge" :class="`level-badge--${item.level}`">{{ item.levelLabel }}</span>
                  </td>
                  <td>
                    <span class="risk-dot" :style="{ background: levelColor(item.level) }" />
                    {{ riskText[item.level] }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.basic-ledger {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ═══ Section ═══ */
.ledger-section {
  padding: 10px 14px;
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
}

.section-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: #b8ecff;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '';
    width: 3px;
    height: 13px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.45);
  }
}

.subsection-title {
  margin: 10px 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #9edcff;
  letter-spacing: 0.03em;
}

/* ═══ Info Table — 紧凑行内布局 ═══ */
.info-table {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border: 1px solid rgba(102, 217, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: rgba(0, 45, 84, 0.16);

  &:nth-child(even) {
    background: rgba(0, 45, 84, 0.08);
  }
}

.info-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  min-width: 0;
  border-right: 1px solid rgba(102, 217, 255, 0.06);

  &:last-child {
    border-right: none;
  }

  &--wide {
    grid-column: 1 / -1;
    border-right: none;
  }
}

.info-lbl {
  color: #6899b8;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;

  &::after {
    content: '：';
  }
}

.info-val {
  color: #d8ecff;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &--tag {
    padding: 1px 6px;
    border: 1px solid rgba(232, 200, 120, 0.45);
    border-radius: 3px;
    background: linear-gradient(135deg, rgba(140, 100, 20, 0.32), rgba(80, 55, 10, 0.35));
    color: #f0d78a;
    font-size: 11px;
  }
}

.info-section-divider {
  margin: 8px 0;
  border-top: 1px dashed rgba(102, 217, 255, 0.14);
}

.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;

  &--potential {
    border: 1px solid rgba(55, 233, 145, 0.55);
    background: linear-gradient(135deg, rgba(20, 140, 80, 0.28), rgba(8, 70, 42, 0.35));
    color: #4dffb0;
  }
}

.info-note {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  padding: 4px 10px;
  border-radius: 3px;
  background: rgba(0, 45, 84, 0.16);
  border: 1px solid rgba(0, 180, 255, 0.06);
  font-size: 12px;
  color: #b0d4e8;
  line-height: 1.5;

  &__label {
    color: #78a9ca;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
  }
}

/* ═══ Status Grid ═══ */
.status-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 5px;
}

.status-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  border-left: 2px solid;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.56);

  &--safe { border-color: #55e995; }
  &--warn { border-color: #facc15; }
  &--risk { border-color: #ff7474; }
  &--info { border-color: #65dfff; }

  &__label {
    color: #7eb4d8;
    font-size: 11px;
    font-weight: 600;
  }

  &__value {
    color: #e8f4ff;
    font-size: 13px;
    font-weight: 700;
  }
}

/* ═══ Dynamic List ═══ */
.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dynamic-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 3px;
  border: 1px solid rgba(120, 200, 255, 0.14);
  background: rgba(0, 40, 78, 0.4);

  &--award {
    border-color: rgba(55, 233, 145, 0.25);
    .dynamic-time { color: #67e8a3; background: rgba(55, 233, 145, 0.15); }
  }

  &--warn {
    border-color: rgba(250, 204, 21, 0.25);
    .dynamic-time { color: #facc15; background: rgba(250, 204, 21, 0.15); }
  }

  &--info {
    .dynamic-time { color: #65dfff; background: rgba(45, 206, 255, 0.12); }
  }
}

.dynamic-time {
  padding: 1px 5px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.dynamic-text {
  color: #e8f4ff;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ═══ Warning Summary ═══ */
.warning-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.warning-card {
  padding: 10px;
  border: 1px solid;
  border-radius: 4px;
  background: rgba(6, 17, 52, 0.4);

  &--clickable {
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0, 184, 255, 0.14);
      border-color: rgba(0, 212, 255, 0.55);
    }
  }

  &--low {
    border-color: rgba(74, 222, 128, 0.25);
    background: rgba(38, 151, 92, 0.06);
  }

  &--medium {
    border-color: rgba(250, 204, 21, 0.25);
    background: rgba(174, 121, 10, 0.06);
  }

  &--high {
    border-color: rgba(248, 91, 91, 0.3);
    background: rgba(185, 43, 55, 0.08);
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 4px;
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__label {
    color: #e8f4ff;
    font-size: 13px;
    font-weight: 700;
    flex: 1;
  }

  &__level {
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }

  &__tip {
    margin: 0 0 6px;
    color: #8fb7cd;
    font-size: 10px;
    line-height: 1.35;
  }

  &__link {
    margin-left: 4px;
    color: #00d4ff;
    font-weight: 700;
    white-space: nowrap;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 5px;
    border-radius: 2px;
    background: rgba(0, 0, 0, 0.15);
    font-size: 10px;
    overflow: hidden;

    &--low { border-left: none; }
    &--medium { border-left: none; }
    &--high { border-left: none; }

    &-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    &-category {
      color: #78a9ca;
      flex-shrink: 0;
    }

    &-label {
      color: #d0e8f8;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-level {
      font-weight: 700;
      flex-shrink: 0;
    }
  }

  &__empty {
    color: #5a7d96;
    font-size: 10px;
    font-style: italic;
  }
}

/* ═══ Warning Detail Table ═══ */
.warning-detail-table {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(102, 217, 255, 0.1);
}

.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 184, 255, 0.2); border-radius: 2px; }
}

.warning-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  color: rgba(184, 236, 255, 0.85);

  th {
    text-align: left;
    padding: 5px 8px;
    font-size: 11px;
    font-weight: 700;
    color: #9ecae8;
    border-bottom: 1px solid rgba(102, 217, 255, 0.12);
    white-space: nowrap;
  }

  td {
    padding: 5px 8px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.05);
  }

  tbody tr {
    transition: background 0.15s;
    &:hover { background: rgba(0, 184, 255, 0.04); }
  }

  .row--low {
    td:first-child { border-left: 2px solid rgba(74, 222, 128, 0.5); }
  }
  .row--medium {
    td:first-child { border-left: 2px solid rgba(250, 204, 21, 0.5); }
  }
  .row--high {
    td:first-child { border-left: 2px solid rgba(248, 91, 91, 0.5); }
  }

  .cell-label {
    font-weight: 600;
    color: #d0e8f8;
  }
}

.cat-badge {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 999px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.12);
  color: #8ef6ff;
  white-space: nowrap;
}

.level-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  font-weight: 700;

  &--low { background: rgba(74, 222, 128, 0.12); color: #55e995; }
  &--medium { background: rgba(250, 204, 21, 0.12); color: #facc15; }
  &--high { background: rgba(248, 91, 91, 0.12); color: #ff7474; }
}

.risk-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}



/* ═══ Section 模拟数据标签 ═══ */
.section-mock-tag {
  display: inline-block;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  color: #f0a040;
  border: 1px solid rgba(240, 160, 64, 0.4);
  border-radius: 3px;
  background: rgba(240, 160, 64, 0.08);
  white-space: nowrap;
  vertical-align: middle;
  margin-left: 6px;
  line-height: 18px;
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
  .info-row { grid-template-columns: 1fr 1fr; }
  .status-grid { grid-template-columns: repeat(3, 1fr); }
  .warning-summary { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .info-row { grid-template-columns: 1fr; }
  .status-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
