<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM } from '@/types/student/view'
import StuHint from '@/components/student/template/StuHint.vue'

const route = useRoute()
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

/* ────────────────────────────────────────────────
   1. 全景研判
   ──────────────────────────────────────────────── */
const summary = computed(() => dashboard.value?.aiPortrait.summary || '')
const jobMatches = computed(() => dashboard.value?.aiPortrait.jobMatches || [])
const strengthTags = computed(() => {
  const portrait = dashboard.value?.aiPortrait
  if (!portrait) return []
  if (portrait.strengthTags?.length) return portrait.strengthTags
  return portrait.portraitTags
    .filter((t) => /高潜|优势|稳定|正向/.test(t))
    .slice(0, 6)
    .concat(portrait.portraitTags.filter((t) => !/高潜|优势|稳定|正向|待|不足/.test(t)).slice(0, 2))
    .slice(0, 6)
})
const focusTags = computed(() => {
  const portrait = dashboard.value?.aiPortrait
  if (!portrait) return []
  if (portrait.focusTags?.length) return portrait.focusTags
  return portrait.portraitTags
    .filter((t) => /待|不足|短板|关注/.test(t))
    .concat(['实践经历不足'])
    .slice(0, 6)
})

/** 基础信息摘要（顶部 KPI 行） */
const profileDigest = computed(() => {
  const p = dashboard.value?.profile
  if (!p) return { name: '—', id: '—', major: '—', grade: '—', gpa: '—', rank: '—' }
  return {
    name: p.name,
    id: p.studentId,
    major: p.major || '计算机科学与技术',
    grade: p.grade || '2022级',
    gpa: p.gpa ?? '3.72',
    rank: p.rank ?? '12/156',
  }
})

/** AI 综合评价（按学业/素养/就业/风险维度综合） */
const aiEvaluation = computed(() => {
  const d = dashboard.value
  if (!d) return { level: 'B+', score: 84, trend: '稳定向好' }
  const avg =
    (d.academic.gpa * 10 + (d.employment.jobReadiness || 70) + (d.quality.score || 80)) / 3
  const score = Math.round(avg)
  const level = score >= 90 ? 'A+' : score >= 85 ? 'A' : score >= 80 ? 'A-' : score >= 75 ? 'B+' : 'B'
  return { level, score, trend: '稳定向好' }
})

/** 全景研判涵盖的维度标签 */
const panoramaDimTags = [
  '学生基础信息',
  '学业表现',
  'GPA / 排名 / 成绩趋势',
  '专业能力评价',
  '综合能力画像',
  '竞赛获奖情况',
  '科研/项目经历',
  '技能掌握情况',
  '发展方向',
  '岗位匹配度',
  '学生标签',
  'AI 综合评价',
]

/* ────────────────────────────────────────────────
   2. 风险雷达
   ──────────────────────────────────────────────── */
const riskItems = computed(() => {
  const portrait = dashboard.value?.aiPortrait
  if (!portrait) return []
  return portrait.pushes.filter(
    (p) => p.type === 'warn' || /预警|风险|不足|挂科|学分/.test(p.text),
  )
})

/** 综合风险等级 + 风险评分（顶部摘要行） */
const riskSummary = computed(() => {
  const d = dashboard.value
  if (!d) return { level: '中', score: 38, color: '#facc15' }
  // 用学业、就业、心育三块粗略估算
  const academicRisk = d.academic.gpa < 2.5 ? 60 : d.academic.gpa < 3 ? 40 : 20
  const jobRisk = (d.employment.jobReadiness || 70) < 60 ? 50 : 25
  const mentalRisk = 20
  const score = Math.min(100, Math.round((academicRisk + jobRisk + mentalRisk) / 3))
  const level = score >= 60 ? '高' : score >= 30 ? '中' : '低'
  const color = score >= 60 ? '#ff7474' : score >= 30 ? '#facc15' : '#55e995'
  return { level, score, color }
})

/** 重点关注事项（3 项） */
const focusItems = [
  { tag: '学业', text: '挂科补考：高等数学需参加期末补考，建议尽快制定复习计划' },
  { tag: '心理', text: '心理焦虑：近期测评显示轻度焦虑倾向，建议定期关注并适时疏导' },
  { tag: '就业', text: '实习缺失：目前尚未完成任何专业对口实习经历，影响就业竞争力' },
]

/** 风险雷达涵盖维度标签 */
const riskDimTags = [
  '综合风险等级',
  '学业风险',
  '毕业风险',
  '就业风险',
  '发展风险',
  '风险评分',
  '风险触发原因',
  '风险变化情况',
  '重点关注事项',
  '风险处理建议',
]

/* ────────────────────────────────────────────────
   3. 育人智策
   ──────────────────────────────────────────────── */
const coachTasks = computed(() => {
  const d = dashboard.value
  if (!d) return []
  const { aiAssistant, aiPortrait } = d
  const tasks = aiPortrait.coachingTasks || []
  return [
    {
      title: tasks[0]?.title || '本周优先：开展毕业学分核查',
      badge: tasks[0]?.priority || '待办',
      detail: tasks[0]?.detail || aiAssistant.shortTermSuggestions[0] || '建议辅导员与学生核对培养方案',
    },
    {
      title: tasks[1]?.title || '本月重点：补充专业实践成果',
      badge: tasks[1]?.priority || '跟进',
      detail: tasks[1]?.detail || aiAssistant.longTermSuggestions[0] || '建议参加1项竞赛或创新项目',
    },
  ]
})

/** 育人智策涵盖维度标签 */
const coachDimTags = [
  '当前培养阶段',
  '阶段培养目标',
  '学生优势分析',
  '学生短板分析',
  '重点培养方向',
  '近期培养任务',
  '中长期培养任务',
  '推荐培养措施',
  '推荐资源',
  '跟踪关注建议',
]

/* ────────────────────────────────────────────────
   4. 机会雷达
   ──────────────────────────────────────────────── */
const opportunities = computed(() => {
  const portrait = dashboard.value?.aiPortrait
  if (!portrait) return []
  if (portrait.opportunities?.length) return portrait.opportunities
  return portrait.pushes
    .filter((p) => p.type !== 'warn')
    .map((p) => ({ time: p.time, text: p.text, action: '参考资料' }))
})

/** 机会类型分布（顶部标签） */
const opportunityTypes = [
  { key: '竞赛', icon: '🏆' },
  { key: '项目', icon: '🛠' },
  { key: '实习', icon: '💼' },
  { key: '证书', icon: '📜' },
  { key: '招聘', icon: '🎯' },
] as const

/** 机会雷达涵盖维度标签 */
const opportunityDimTags = [
  '推荐机会类型',
  '机会名称',
  '机会匹配度',
  '推荐原因',
  '报名时间',
  '截止时间',
  '参与状态',
  '历史参与情况',
  '机会价值分析',
]

/* ────────────────────────────────────────────────
   5. 成长路径
   ──────────────────────────────────────────────── */
const pathNodes = computed(() => {
  const d = dashboard.value
  if (!d) return []
  const { aiAssistant, employment } = d
  return [
    {
      stage: '本学期',
      anchor: '专业项目 / 学科竞赛',
      items: aiAssistant.shortTermSuggestions.concat(['完成职业能力测评']),
    },
    {
      stage: '未来一年',
      anchor: '企业实习 / 技能证书',
      items: ['完成1段专业对口实习', '获得1项专业技能证书', '建立项目作品集', '提升团队协作和表达能力'],
    },
    {
      stage: '毕业前',
      anchor: '就业/升学 / 毕业审核',
      items: [employment.developmentPath.long, '完善简历、作品集或升学材料', '达成就业或升学目标'].filter(Boolean),
    },
  ]
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="智能育航 · 全景详情"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId}` : ''"
    back-text="← 返回学生发展概览"
    :back-to="{ name: 'student', query: { studentId: activeStudentId } }"
  >
    <div v-if="loading" class="placeholder">
      <span class="spinner" /> 正在加载...
    </div>
    <div v-else-if="error" class="placeholder error">
      <span>{{ error }}</span><button @click="load">重试</button>
    </div>

    <div v-else-if="dashboard" class="ai-detail">
      <!-- ─── 1. 全景研判 ─── -->
      <section class="warn-section">
        <h3 class="warn-section__title">全景研判</h3>
        <StuHint tip="基于学业、素养与就业画像生成的综合研判摘要。" block>
          <p class="ai-summary">{{ summary }}</p>
        </StuHint>
        <div v-if="jobMatches.length" class="ai-jobs">
          <StuHint
            v-for="job in jobMatches"
            :key="job.role"
            block
            :tip="`岗位匹配度 ${job.match}%（越高越对口）。${[job.city, job.salary, job.requirements].filter(Boolean).join(' · ') || '暂无更多要求描述。'}`"
          >
            <div class="ai-job">
              <div class="ai-job__head">
                <strong>{{ job.role }}</strong>
                <b>{{ job.match }}%</b>
              </div>
              <i><em :style="{ width: `${job.match}%` }" /></i>
            </div>
          </StuHint>
        </div>
        <div class="ai-tags">
          <div>
            <StuHint tip="相对突出的能力或表现标签。"><em>优势</em></StuHint>
            <span v-for="tag in strengthTags" :key="tag" class="tag tag--good">{{ tag }}</span>
          </div>
          <div>
            <StuHint tip="短板或需补强的关注点。"><em>关注</em></StuHint>
            <span v-for="tag in focusTags" :key="tag" class="tag tag--warn">{{ tag }}</span>
          </div>
        </div>
      </section>

      <!-- ─── 2. 风险雷达：学业 / 心理 / 就业 ─── -->
      <section class="warn-section">
        <h3 class="warn-section__title">
          风险雷达
          <span v-if="riskItems.length" class="warn-section__count">{{ riskItems.length }}</span>
        </h3>
        <div class="risk-category-list">
          <!-- 学业风险 -->
          <article class="ai-risk ai-risk--academic">
            <header>
              <strong>学业风险</strong>
              <span class="risk-tag risk-tag--academic">学业</span>
            </header>
            <p>高等数学挂科待补考（2 学分），若补考未通过将触发学籍预警；本学期课程通过率 85%，需重点关注后续考试安排。</p>
          </article>
          <!-- 心理风险 -->
          <article class="ai-risk ai-risk--mental">
            <header>
              <strong>心理风险</strong>
              <span class="risk-tag risk-tag--mental">心理</span>
            </header>
            <p>近期心理测评显示轻度焦虑倾向，焦虑主要来源于学业压力和就业前景不确定性，建议定期关注并适时疏导。</p>
          </article>
          <!-- 就业风险 -->
          <article class="ai-risk ai-risk--employment">
            <header>
              <strong>就业风险</strong>
              <span class="risk-tag risk-tag--employment">就业</span>
            </header>
            <p>尚未完成任何专业对口实习经历，简历项目经验较为空白，职业规划方向不够清晰，就业竞争力有待提升。</p>
          </article>
        </div>
      </section>

      <!-- ─── 重点关注事项 ─── -->
      <section class="warn-section">
        <h3 class="warn-section__title">重点关注事项</h3>
        <article v-for="(item, idx) in focusItems" :key="idx" class="ai-risk">
          <header>
            <strong>{{ item.tag }}</strong>
          </header>
          <p>{{ item.text }}</p>
        </article>
      </section>

      <!-- ─── 毕业风险 + 风险变化 / 处理建议（合并卡片） ─── -->
      <section class="warn-section detail-card--wide">
        <h3 class="warn-section__title">毕业风险</h3>
        <StuHint tip="基于学分、绩点、课程完成情况的毕业风险综合评估。" block>
          <p class="ai-summary">
            该生当前毕业风险等级为 <strong style="color:#facc15">中等</strong>，主要风险点为高等数学挂科待补考（2 学分），
            若补考未通过将影响正常毕业。此外，通识选修课尚缺 3 学分，建议本学期内补足。
          </p>
        </StuHint>
        <div class="risk-bottom-row">
          <div class="risk-bottom-col">
            <h4 class="risk-sub-title">风险变化情况</h4>
            <ul class="risk-change-list">
              <li>2024秋：高等数学首次挂科，触发学业预警</li>
              <li>2025春：补考未通过，风险等级从低升至中</li>
              <li>2025秋：新增通识选修学分缺口，风险持续</li>
            </ul>
          </div>
          <div class="risk-bottom-col">
            <h4 class="risk-sub-title">风险处理建议</h4>
            <ul class="risk-change-list">
              <li>优先安排高等数学补考辅导，制定专项复习计划</li>
              <li>本学期内完成至少 1 门通识选修课修读</li>
              <li>每月跟踪学分修读进度，建立毕业审核台账</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- ─── 3. 育人智策 ─── -->
      <section class="warn-section detail-card--wide">
        <h3 class="warn-section__title">育人智策</h3>
        <div class="panorama-grid">
          <!-- 培养阶段 + 培养目标 -->
          <div class="coach-card coach-stage-card">
            <div class="coach-card__title">当前培养阶段</div>
            <div class="coach-card__body">
              <span class="coach-stage-badge">大二下学期</span>
              <p class="coach-goal-text">专业核心课密集阶段，是夯实专业基础、明确发展方向的关键时期</p>
            </div>
          </div>
          <div class="coach-card">
            <div class="coach-card__title">阶段培养目标</div>
            <div class="coach-card__body">
              <p>巩固专业核心课程成绩，确保 GPA 稳定在 3.5 以上；初步确定就业或升学意向</p>
            </div>
          </div>

          <!-- 优势 + 短板 -->
          <div class="coach-card coach-strength-card">
            <div class="coach-card__title">学生优势</div>
            <div class="coach-card__body">
              <ul class="coach-list--strength">
                <li>编程基础扎实，数据结构与算法成绩优异（92 分）</li>
                <li>具有良好的自学能力和问题解决能力</li>
                <li>英语水平突出，CET-6 高分通过</li>
              </ul>
            </div>
          </div>
          <div class="coach-card coach-weakness-card">
            <div class="coach-card__title">学生短板</div>
            <div class="coach-card__body">
              <ul class="coach-list--weakness">
                <li>数学基础较薄弱，高等数学连续挂科</li>
                <li>项目实践经历不足，缺乏团队协作项目经验</li>
                <li>职业规划不清晰，对行业认知有限</li>
              </ul>
            </div>
          </div>

          <!-- 重点培养方向 + 近期培养任务 -->
          <div class="coach-card coach-focus-card">
            <div class="coach-card__title">重点培养方向</div>
            <div class="coach-card__body">
              <ol class="coach-list--numbered">
                <li><span class="coach-list-num">1</span>补足数学短板，通过补考并稳定后续数学课程成绩</li>
                <li><span class="coach-list-num">2</span>积累项目实践经验，参加学科竞赛或创新项目</li>
                <li><span class="coach-list-num">3</span>明确职业发展方向，制定个人成长路线图</li>
              </ol>
            </div>
          </div>
          <div class="coach-card">
            <div class="coach-card__title">近期培养任务</div>
            <div class="coach-card__body">
              <article
                v-for="task in coachTasks"
                :key="task.title"
                class="ai-task--enhanced"
              >
                <header>
                  <strong>{{ task.title }}</strong>
                  <span class="ai-task__badge">{{ task.badge }}</span>
                </header>
                <p>{{ task.detail }}</p>
              </article>
            </div>
          </div>

          <!-- 中长期培养任务 + 推荐培养措施 -->
          <div class="coach-card">
            <div class="coach-card__title">中长期培养任务</div>
            <div class="coach-card__body">
              <ol class="coach-list--numbered">
                <li><span class="coach-list-num">1</span>大三上学期前完成 1 段企业实习</li>
                <li><span class="coach-list-num">2</span>参加省级及以上学科竞赛并获奖</li>
                <li><span class="coach-list-num">3</span>建立个人项目作品集（GitHub）</li>
              </ol>
            </div>
          </div>
          <div class="coach-card">
            <div class="coach-card__title">推荐培养措施</div>
            <div class="coach-card__body">
              <ul class="coach-list--measure">
                <li>安排学业导师一对一辅导高等数学</li>
                <li>推荐加入学院创新实验室参与科研项目</li>
                <li>组织参加企业开放日和技术分享活动</li>
                <li>建立学期成长档案，定期进行阶段性评估</li>
              </ul>
            </div>
          </div>

          <!-- 推荐资源 + 跟踪建议 -->
          <div class="coach-card coach-resource-card">
            <div class="coach-card__title">推荐资源</div>
            <div class="coach-card__body">
              <div class="coach-resource-tag">
                <span class="coach-resource-dot"></span> 数学辅导中心 · 每周三/五开放
              </div>
              <div class="coach-resource-tag">
                <span class="coach-resource-dot"></span> 蓝桥杯竞赛培训 · 报名截止 3 月 15 日
              </div>
              <div class="coach-resource-tag">
                <span class="coach-resource-dot"></span> 字节跳动开放日 · 4 月 8 日
              </div>
              <div class="coach-resource-tag">
                <span class="coach-resource-dot"></span> 职业规划咨询 · 就业指导中心预约
              </div>
            </div>
          </div>
          <div class="coach-card coach-track-card">
            <div class="coach-card__title">跟踪关注建议</div>
            <div class="coach-card__body">
              <div class="coach-track-item">
                <span class="coach-track-step">每月</span>
                <span>检查数学补考复习进度和学习状态</span>
              </div>
              <div class="coach-track-item">
                <span class="coach-track-step">每学期</span>
                <span>评估学分修读情况，确保毕业要求达标</span>
              </div>
              <div class="coach-track-item">
                <span class="coach-track-step">持续</span>
                <span>关注心理健康状况，适时进行心理疏导</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── 4. 机会雷达 ─── -->
      <section class="warn-section">
        <h3 class="warn-section__title">
          机会雷达
          <span v-if="opportunities.length" class="warn-section__count">{{ opportunities.length }}</span>
        </h3>
        <template v-if="opportunities.length">
          <div class="ai-timeline">
            <StuHint
              v-for="(item, idx) in opportunities"
              :key="idx"
              block
              tip="近期可关注的竞赛、实习或活动机会。"
            >
              <div class="ai-timeline__item">
                <em>{{ item.time }}</em>
                <p>{{ item.text }}</p>
                <span v-if="item.action" class="ai-timeline__action">{{ item.action }}</span>
              </div>
            </StuHint>
          </div>
        </template>
        <p v-else class="ai-empty">当前暂无机会推送。</p>
      </section>

      <!-- ─── 5. 成长路径 ─── -->
      <section class="warn-section">
        <h3 class="warn-section__title">成长路径</h3>
        <div class="ai-path-cols">
          <StuHint
            v-for="node in pathNodes"
            :key="node.stage"
            block
            :tip="`${node.stage}阶段行动清单（${node.anchor}）。`"
          >
            <div>
              <strong>{{ node.stage }}</strong>
              <span class="ai-path__anchor">{{ node.anchor }}</span>
              <ul>
                <li v-for="item in node.items" :key="item">{{ item }}</li>
              </ul>
            </div>
          </StuHint>
        </div>
      </section>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.ai-detail {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.warn-section {
  padding: 12px 14px;
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
  animation: sectionSlideUp 0.5s ease-out both;
  &:nth-child(1) { animation-delay: 0.04s; }
  &:nth-child(2) { animation-delay: 0.08s; }
  &:nth-child(3) { animation-delay: 0.12s; }
  &:nth-child(4) { animation-delay: 0.16s; }
  &:nth-child(5) { animation-delay: 0.20s; }
}

.warn-section__title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
  color: #b8ecff;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '';
    width: 3px;
    height: 13px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.45);
  }
}

.warn-section__count {
  padding: 1px 8px;
  border-radius: 8px;
  background: rgba(255, 120, 80, 0.22);
  color: #ffb4a0;
  font-size: 12px;
  font-weight: 700;
}

/* ─── 风险分类标签 ─── */
.risk-category-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.risk-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;

  &--academic {
    background: rgba(255, 120, 80, 0.18);
    color: #ff9472;
  }

  &--mental {
    background: rgba(192, 132, 252, 0.18);
    color: #c796ff;
  }

  &--employment {
    background: rgba(52, 211, 200, 0.18);
    color: #5eead4;
  }
}

.ai-risk--academic {
  border-left: 3px solid rgba(255, 120, 80, 0.4);
}

.ai-risk--mental {
  border-left: 3px solid rgba(192, 132, 252, 0.4);
}

.ai-risk--employment {
  border-left: 3px solid rgba(52, 211, 200, 0.4);
}

/* ─── 毕业风险概览标签 ─── */
.risk-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.risk-overview-tag {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;

  &--low {
    background: rgba(85, 233, 149, 0.15);
    border: 1px solid rgba(85, 233, 149, 0.3);
    color: #55e995;
  }

  &--medium {
    background: rgba(250, 204, 21, 0.15);
    border: 1px solid rgba(250, 204, 21, 0.3);
    color: #facc15;
  }

  &--high {
    background: rgba(255, 116, 116, 0.15);
    border: 1px solid rgba(255, 116, 116, 0.3);
    color: #ff7474;
  }

  &--academic {
    background: rgba(255, 120, 80, 0.12);
    border: 1px solid rgba(255, 120, 80, 0.25);
    color: #ff9472;
  }

  &--mental {
    background: rgba(192, 132, 252, 0.12);
    border: 1px solid rgba(192, 132, 252, 0.25);
    color: #c796ff;
  }

  &--employment {
    background: rgba(52, 211, 200, 0.12);
    border: 1px solid rgba(52, 211, 200, 0.25);
    color: #5eead4;
  }
}

/* ─── 合并宽卡片 ─── */
.detail-card--wide {
  grid-column: span 2;
}

/* ─── 风险底部并排 ─── */
.risk-bottom-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.risk-bottom-col {
  padding: 10px 12px;
  border: 1px solid rgba(0, 180, 255, 0.12);
  border-radius: 6px;
  background: rgba(0, 30, 60, 0.28);
}

.risk-sub-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: #8fc8e8;
}

.risk-change-list {
  margin: 0;
  padding-left: 18px;
  color: #cfe6f8;
  font-size: 13px;
  line-height: 1.7;

  li {
    margin-bottom: 4px;
  }
}

.ai-summary {
  margin: 0 0 12px;
  color: #d8eeff;
  font-size: 15px;
  line-height: 1.6;
}

.ai-jobs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.ai-job {
  padding: 9px 11px;
  border: 1px solid rgba(0, 180, 255, 0.14);
  border-radius: 6px;
  background: rgba(0, 40, 78, 0.35);

  &__head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 15px;

    strong { color: #eaf6ff; font-weight: 700; }
    b { color: #7ff6ff; font-weight: 700; }
  }

  i {
    display: block;
    height: 6px;
    margin-top: 8px;
    overflow: hidden;
    border-radius: 99px;
    background: rgba(80, 120, 160, 0.35);

    em {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #1ed6ff, #43e7af);
    }
  }
}

.ai-tags {
  display: grid;
  gap: 8px;

  em {
    display: block;
    margin-bottom: 4px;
    color: #8eb8d8;
    font-size: 13px;
    font-style: normal;
    font-weight: 700;
  }
}

.tag {
  display: inline-block;
  margin: 0 6px 4px 0;
  padding: 4px 9px;
  border-radius: 3px;
  font-size: 13px;
  font-weight: 700;

  &--good {
    border: 1px solid rgba(55, 233, 145, 0.35);
    background: rgba(20, 100, 70, 0.25);
    color: #67e8a3;
  }

  &--warn {
    border: 1px solid rgba(250, 204, 21, 0.35);
    background: rgba(120, 90, 10, 0.25);
    color: #facc15;
  }
}

.ai-risk,
.ai-task {
  margin-bottom: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(0, 180, 255, 0.14);
  border-radius: 6px;
  background: rgba(0, 40, 78, 0.35);

  header {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 15px;

    strong { color: #eaf6ff; }
    span { color: #f0b27a; font-size: 13px; font-weight: 700; }
  }

  p {
    margin: 0;
    color: #cfe6f8;
    font-size: 15px;
    line-height: 1.55;
  }
}

/* ─── 育人智策布局 ─── */
.panorama-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.coach-card {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid rgba(0, 180, 255, 0.12);
  background: rgba(0, 30, 60, 0.28);

  &__title {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: 700;
    color: #8fc8e8;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(0, 180, 255, 0.1);
  }

  &__body {
    color: #cfe6f8;
    font-size: 13px;
    line-height: 1.65;

    p {
      margin: 0;
    }

    ul, ol {
      margin: 0;
      padding-left: 18px;
    }

    li {
      margin-bottom: 4px;
    }
  }
}

/* 培养阶段卡片 */
.coach-stage-card {
  background: linear-gradient(135deg, rgba(0, 120, 200, 0.12), rgba(0, 60, 120, 0.18));
  border-color: rgba(30, 180, 255, 0.22);
}

.coach-stage-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(0, 180, 255, 0.2), rgba(0, 220, 255, 0.15));
  border: 1px solid rgba(0, 200, 255, 0.3);
  color: #6cdfff;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
}

.coach-goal-text {
  margin-top: 6px;
  color: #cfe6f8;
  font-size: 13px;
}

/* 优势列表 */
.coach-list--strength {
  list-style: none !important;
  padding-left: 0 !important;

  li {
    padding: 4px 0 4px 14px;
    border-left: 3px solid #43e7af;
    margin-bottom: 6px;
    padding-left: 14px;
    color: #67e8a3;
  }
}

/* 短板列表 */
.coach-list--weakness {
  list-style: none !important;
  padding-left: 0 !important;

  li {
    padding: 4px 0 4px 14px;
    border-left: 3px solid #facc15;
    margin-bottom: 6px;
    padding-left: 14px;
    color: #facc15;
  }
}

/* 编号列表 */
.coach-list--numbered {
  list-style: none !important;
  padding-left: 0 !important;
  counter-reset: coach-num;

  li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 6px;
  }
}

.coach-list-num {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(30, 214, 255, 0.25), rgba(0, 184, 255, 0.18));
  border: 1px solid rgba(30, 214, 255, 0.3);
  color: #55dfff;
  font-size: 11px;
  font-weight: 700;
}

/* 培养措施列表 */
.coach-list--measure {
  list-style: none !important;
  padding-left: 0 !important;

  li {
    padding: 4px 0 4px 14px;
    border-left: 3px solid #c084fc;
    margin-bottom: 6px;
    padding-left: 14px;
  }
}

/* 增强任务卡片 */
.ai-task--enhanced {
  padding: 10px 12px;
  margin-bottom: 8px;
  border-left: 3px solid rgba(30, 214, 255, 0.5);
  border-radius: 5px;
  background: rgba(0, 60, 100, 0.2);
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 80, 120, 0.25);
  }

  &:last-child {
    margin-bottom: 0;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;

    strong {
      color: #eaf6ff;
      font-size: 14px;
      font-weight: 700;
    }
  }

  p {
    margin: 0;
    color: #cfe6f8;
    font-size: 13px;
    line-height: 1.55;
  }
}

.ai-task__badge {
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(255, 120, 80, 0.2);
  color: #ffb4a0;
  font-size: 11px;
  font-weight: 700;
}

/* 推荐资源标签 */
.coach-resource-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  margin-bottom: 6px;
  border-radius: 4px;
  background: rgba(0, 100, 150, 0.15);
  font-size: 13px;
  color: #cfe6f8;
  flex-wrap: wrap;

  &:last-child {
    margin-bottom: 0;
  }
}

.coach-resource-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #55dfff;
  flex-shrink: 0;
}

/* 跟踪建议 */
.coach-track-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(0, 180, 255, 0.06);
  font-size: 13px;

  &:last-child {
    border-bottom: none;
  }
}

.coach-track-step {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(0, 184, 255, 0.2), rgba(0, 140, 200, 0.15));
  border: 1px solid rgba(0, 184, 255, 0.25);
  color: #55dfff;
  font-size: 11px;
  font-weight: 700;
}

.ai-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-timeline__item {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border-left: 2px solid rgba(30, 214, 255, 0.45);
  background: rgba(0, 40, 78, 0.3);
  font-size: 15px;

  em { color: #7ff6ff; font-style: normal; font-weight: 700; }
  p { margin: 0; color: #d8eeff; }
}

.ai-timeline__action {
  padding: 2px 8px;
  border-radius: 3px;
  background: rgba(0, 184, 255, 0.12);
  color: #55dfff;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.ai-path-cols {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;

  :deep(.stu-hint--block) {
    min-width: 0;
  }

  strong {
    display: block;
    margin-bottom: 4px;
    color: #a8e8ff;
    font-size: 15px;
  }

  ul {
    margin: 0;
    padding-left: 16px;
    color: #cfe6f8;
    font-size: 13px;
    line-height: 1.5;
  }
}

.ai-path__anchor {
  display: block;
  margin-bottom: 6px;
  color: #8fb7cd;
  font-size: 12px;
  font-weight: 600;
}

.ai-empty {
  margin: 16px 0;
  text-align: center;
  color: #7aa4c0;
  font-size: 15px;
}

/* ─── Loading / Error ─── */
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 320px;
  font-size: 15px;
  color: rgba(184, 236, 255, 0.7);

  &.error {
    color: #f87171;
    flex-direction: column;
  }

  button {
    padding: 4px 14px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.3);
    background: rgba(0, 184, 255, 0.1);
    color: #55dfff;
    cursor: pointer;
    font-size: 13px;

    &:hover {
      background: rgba(0, 184, 255, 0.2);
    }
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

@keyframes sectionSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1280px) {
  .ai-detail {
    grid-template-columns: 1fr;
  }

  .detail-card--wide {
    grid-column: span 1;
  }

  .risk-bottom-row {
    grid-template-columns: 1fr;
  }

  .panorama-grid {
    grid-template-columns: 1fr;
  }

  .ai-path-cols {
    grid-template-columns: 1fr;
  }
}
</style>
