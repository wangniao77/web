<script setup lang="ts">
/**
 * 就业预警详情（二级页面）
 * 路由：/student/employment-warning?studentId=xxx
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM, JobMatchVM, AttentionItemVM } from '@/types/student/view'

const route = useRoute()
const router = useRouter()
const { studentScope } = useScope()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || studentScope.value.studentId,
)

const dashboard = ref<StudentDashboardVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const selectedJob = ref(0)

async function load() {
  loading.value = true
  error.value = null
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('请求超时，请检查网络或刷新页面')), 10000),
    )
    dashboard.value = await Promise.race([
      studentService.fetchDashboard(activeStudentId.value),
      timeout,
    ])
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function goLedger() {
  router.push({ name: 'student-basic-ledger', query: { studentId: activeStudentId.value } })
}

const levelColor = (level: string) =>
  ({ low: '#55e995', medium: '#facc15', high: '#ff7474' }[level] || '#8fb7cd')

const employmentItems = computed(() => {
  if (!dashboard.value) return []
  const items = (dashboard.value.attention ?? []).filter((i) => /就业|实习|职业/.test(`${i.category}${i.label}`))
  if (items.length >= 4) return items
  const fallback = [
    { id: 'emp-1', category: '实践提醒', label: '暂无企业实习经历', level: 'medium', levelLabel: '需关注' },
    { id: 'emp-2', category: '就业预警', label: '简历状态未完善', level: 'medium', levelLabel: '需关注' },
    { id: 'emp-3', category: '就业预警', label: '目标岗位技能匹配度不足', level: 'medium', levelLabel: '需关注' },
    { id: 'emp-4', category: '职业提醒', label: '就业意向城市尚未填报', level: 'low', levelLabel: '正常' },
    { id: 'emp-5', category: '就业预警', label: '项目经历较少', level: 'low', levelLabel: '正常' },
    { id: 'emp-6', category: '职业提醒', label: '未参加本学期校园招聘会', level: 'low', levelLabel: '正常' },
    { id: 'emp-7', category: '实践提醒', label: '暑期实习投递进度滞后', level: 'medium', levelLabel: '需关注' },
    { id: 'emp-8', category: '就业预警', label: '缺少行业相关证书', level: 'low', levelLabel: '正常' },
    { id: 'emp-9', category: '职业提醒', label: '未加入专业相关社群或协会', level: 'low', levelLabel: '正常' },
    { id: 'emp-10', category: '就业预警', label: '面试邀约次数为零', level: 'medium', levelLabel: '需关注' },
    { id: 'emp-11', category: '实践提醒', label: '缺少校内科研项目经历', level: 'low', levelLabel: '正常' },
    { id: 'emp-12', category: '职业提醒', label: '职业规划书未提交', level: 'low', levelLabel: '正常' },
  ] as AttentionItemVM[]
  return [...items, ...fallback].slice(0, 4)
})

const employmentLevel = computed(() => {
  if (!employmentItems.value.length) return 'low'
  const weights: Record<string, number> = { low: 1, medium: 2, high: 3 }
  return employmentItems.value.reduce((highest, item) =>
    weights[item.level] > weights[highest] ? item.level : highest
  , 'low' as ReturnType<typeof employmentItems.value[number]['level']>)
})

const jobMatches = computed(() => {
  const list = dashboard.value?.aiPortrait?.jobMatches ?? []
  const fallback = [
    { role: 'Java后端开发工程师', match: 92, city: '杭州', salary: '15-25K', requirements: '熟悉 Java 基础、Spring Boot、MySQL，了解 Redis 和消息队列', reason: '专业课程匹配度高，Java 核心课程成绩优秀，项目经验丰富' },
    { role: '前端开发工程师', match: 85, city: '上海', salary: '14-22K', requirements: '熟练掌握 HTML/CSS/JavaScript，熟悉 Vue 或 React 框架', reason: '前端技术栈掌握扎实，有个人项目作品展示' },
    { role: '数据分析师', match: 78, city: '北京', salary: '16-28K', requirements: '掌握 Python/R，熟悉 SQL 和数据分析工具，具备统计学基础', reason: '数学与统计学基础良好，有数据分析相关课程与项目经历' },
    { role: '测试工程师', match: 72, city: '深圳', salary: '12-20K', requirements: '了解软件测试理论，熟悉自动化测试工具，有编程基础', reason: '代码能力达标，学习意愿强，适合从测试切入技术岗位' },
    { role: '产品经理（技术方向）', match: 68, city: '杭州', salary: '15-24K', requirements: '具备良好的逻辑思维与沟通能力，熟悉产品开发流程', reason: '综合素养较高，学生干部经历锻炼沟通与协调能力' },
    { role: '运维工程师', match: 65, city: '成都', salary: '10-18K', requirements: '熟悉 Linux 系统，了解网络协议与服务器配置', reason: '系统管理课程基础良好，动手能力强' },
    { role: 'AI算法工程师', match: 60, city: '北京', salary: '20-35K', requirements: '熟悉机器学习算法，掌握 Python 与深度学习框架，数学功底扎实', reason: '数学与编程基础良好，但算法相关项目经历不足' },
    { role: '全栈开发工程师', match: 55, city: '上海', salary: '18-30K', requirements: '前后端技术均有一定掌握，能独立完成小型项目开发', reason: '技术栈覆盖面广但深度不足，需加强专项能力' },
    { role: '嵌入式开发工程师', match: 82, city: '苏州', salary: '13-22K', requirements: '熟悉 C/C++，了解 STM32、RTOS 与串口通信', reason: '嵌入式课程成绩优秀，有单片机竞赛与硬件项目经历' },
    { role: '游戏客户端开发', match: 76, city: '广州', salary: '16-26K', requirements: '掌握 C++/C# 与 Unity/Unreal 引擎，了解图形渲染基础', reason: '计算机图形学基础扎实，课余参与独立游戏开发' },
    { role: '网络安全工程师', match: 70, city: '南京', salary: '14-24K', requirements: '了解网络协议、渗透测试与安全防护，掌握至少一门脚本语言', reason: '信息安全课程兴趣浓厚，参与过 CTF 竞赛' },
    { role: '数据库管理员（DBA）', match: 66, city: '武汉', salary: '12-20K', requirements: '熟悉 MySQL/PostgreSQL，了解备份、调优与高可用架构', reason: '数据库课程表现突出，有运维与调优实践' },
    { role: '云计算工程师', match: 63, city: '深圳', salary: '18-30K', requirements: '熟悉 Docker/K8s，了解 AWS/阿里云等云平台与 CI/CD', reason: '云原生课程基础良好，动手部署过个人服务' },
    { role: '技术文档工程师', match: 58, city: '成都', salary: '10-16K', requirements: '文字表达清晰，具备技术理解力，熟悉 Markdown 与文档工具', reason: '写作能力强，适合走技术传播方向作为起步' },
    { role: '区块链开发工程师', match: 52, city: '杭州', salary: '20-32K', requirements: '了解 Solidity 与智能合约，熟悉密码学与分布式系统', reason: '对 Web3 方向有兴趣，但工程实践经验尚少' },
    { role: '产品经理（C 端方向）', match: 50, city: '北京', salary: '14-26K', requirements: '具备用户洞察与数据分析能力，熟悉需求管理与原型工具', reason: '沟通与策划能力突出，可作为非技术岗备选方向' },
  ] as JobMatchVM[]
  if (list.length >= 4) return list
  return [...list, ...fallback].slice(0, 4)
})

const weaknesses = computed(() => {
  const d = dashboard.value
  if (!d) return []
  const list: { label: string; level: 'high' | 'medium' | 'low'; desc: string }[] = []
  if (d.internship?.internshipCount === 0) {
    list.push({ label: '实习经历', level: 'high', desc: '暂无企业实习记录，建议利用假期补充' })
  }
  if (d.careerDev?.resumeStatus?.includes('未完善')) {
    list.push({ label: '简历完善度', level: 'medium', desc: '简历状态未完善，缺少项目与技能亮点' })
  }
  if (!d.profile?.cet4Score) {
    list.push({ label: '英语四级', level: 'high', desc: 'CET-4 未通过，多数企业设有门槛' })
  } else if (!d.profile?.cet6Score) {
    list.push({ label: '英语六级', level: 'medium', desc: 'CET-6 未通过，优质岗位竞争力受限' })
  }
  if (d.academic?.gpa > 0 && d.academic?.gpa < 2.5) {
    list.push({ label: '学业成绩', level: 'medium', desc: 'GPA 偏低，可能影响部分企业简历筛选' })
  }
  if (list.length === 0) {
    list.push({ label: '综合条件', level: 'low', desc: '整体就业准备度尚可，持续积累即可' })
  }
  list.push({ label: '项目经历', level: 'medium', desc: '技术项目较少，建议补充开源项目或课程设计' })
  list.push({ label: '面试准备', level: 'medium', desc: '缺乏面试经验，建议参加模拟面试训练' })
  return list
})

const actionPlan = computed(() => {
  const d = dashboard.value
  if (!d) return []
  return [
    { time: '本周', action: '完善个人简历，补充项目经历与技能关键词', tag: '高优' },
    { time: '本月', action: `锁定目标方向「${d.employment?.careerDirections?.[0] || '待定'}」，梳理岗位 JD 技能要求`, tag: '重点' },
    { time: '本学期', action: '参加至少 1 场专业对口双选会或企业宣讲', tag: '建议' },
    { time: '本学期', action: '联系校友或导师获取目标岗位内推机会', tag: '建议' },
    { time: '假期', action: '争取 1 段企业实习或项目实践经历', tag: '长期' },
    { time: '长期', action: '持续提升英语水平，争取通过 CET-6 考试', tag: '长期' },
  ]
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="就业预警详情"
    :subtitle="dashboard ? `${dashboard.profile?.name ?? '未知'} · ${dashboard.profile?.studentId ?? ''}` : ''"
    back-text="← 返回基础信息台账"
    :back-to="{ name: 'student-basic-ledger', query: { studentId: activeStudentId } }"
    mock-badge="模拟数据"
  >
    <div v-if="loading" class="placeholder"><span class="spinner" /> 正在加载...</div>
    <div v-else-if="error" class="placeholder error"><span>{{ error }}</span><button @click="load">重试</button></div>

    <div v-else-if="dashboard" class="employment-warning">
      <!-- KPI -->
      <section class="warn-section">
        <div class="kpi-grid">
          <div class="kpi-card" :class="`kpi-card--${employmentLevel}`">
            <span class="kpi-card__label">就业风险等级</span>
            <strong class="kpi-card__value">{{ employmentLevel === 'high' ? '高危' : employmentLevel === 'medium' ? '需关注' : '正常' }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">就业准备度</span>
            <strong class="kpi-card__value">{{ dashboard.employment?.jobReadiness ?? '待评估' }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">推荐方向</span>
            <strong class="kpi-card__value kpi-card__value--small">{{ dashboard.aiAssistant?.recommendedDirection ?? '暂无推荐' }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">实习经历</span>
            <strong class="kpi-card__value">{{ dashboard.internship?.internshipCount ?? 0 }} 段</strong>
          </div>
        </div>
      </section>

      <!-- 人岗匹配 -->
      <section class="warn-section">
        <h3 class="warn-section__title">人岗匹配推荐 <i class="mock-tag">模拟数据</i></h3>
        <div v-if="jobMatches.length" class="job-match-layout">
          <!-- 左侧：可选岗位列表 -->
          <div class="job-match-list">
            <div
              v-for="(job, idx) in jobMatches.slice(0, 4)"
              :key="idx"
              class="job-match-item"
              :class="{ 'is-active': selectedJob === idx }"
              @click="selectedJob = idx"
            >
              <span class="job-match-item__rank">TOP {{ idx + 1 }}</span>
              <span class="job-match-item__role">{{ job.role }}</span>
              <div class="job-match-item__bar">
                <div
                  class="job-match-item__bar-inner"
                  :style="{ width: `${job.match}%`, background: job.match >= 80 ? '#55e995' : job.match >= 60 ? '#facc15' : '#ff7474' }"
                />
              </div>
              <strong class="job-match-item__match" :style="{ color: job.match >= 80 ? '#55e995' : job.match >= 60 ? '#facc15' : '#ff7474' }">{{ job.match }}%</strong>
            </div>
          </div>
          <!-- 右侧：选中岗位详情 -->
          <div class="job-match-detail">
            <div class="job-match-detail__role">{{ jobMatches[selectedJob].role }}</div>
            <div class="job-match-detail__meta">
              <div class="job-match-detail__kv"><label>匹配度</label><strong :style="{ color: jobMatches[selectedJob].match >= 80 ? '#55e995' : jobMatches[selectedJob].match >= 60 ? '#facc15' : '#ff7474' }">{{ jobMatches[selectedJob].match }}%</strong></div>
              <div class="job-match-detail__kv"><label>城市</label><span>{{ jobMatches[selectedJob].city }}</span></div>
              <div class="job-match-detail__kv"><label>薪资</label><span>{{ jobMatches[selectedJob].salary }}</span></div>
            </div>
            <div class="job-match-detail__section">
              <label>推荐理由</label>
              <p>{{ jobMatches[selectedJob].reason }}</p>
            </div>
            <div class="job-match-detail__section">
              <label>岗位要求</label>
              <p>{{ jobMatches[selectedJob].requirements }}</p>
            </div>
          </div>
        </div>
        <div v-else class="empty-cell">暂无人岗匹配数据</div>
      </section>

      <!-- 能力短板 -->
      <section class="warn-section">
        <h3 class="warn-section__title">就业能力短板分析</h3>
        <div class="weakness-list">
          <div v-for="(w, idx) in weaknesses" :key="idx" class="weakness-item" :class="`weakness-item--${w.level}`">
            <span class="weakness-item__dot" :style="{ background: levelColor(w.level) }" />
            <span class="weakness-item__label">{{ w.label }}</span>
            <span class="weakness-item__level" :style="{ color: levelColor(w.level) }">{{ { low: '良好', medium: '需关注', high: '短板' }[w.level] }}</span>
            <span class="weakness-item__desc">{{ w.desc }}</span>
          </div>
        </div>
      </section>

      <!-- 求职行动 -->
      <section class="warn-section">
        <h3 class="warn-section__title">求职行动计划</h3>
        <div class="action-list">
          <div v-for="(a, idx) in actionPlan" :key="idx" class="action-item">
            <span class="action-item__time">{{ a.time }}</span>
            <span class="action-item__text">{{ a.action }}</span>
            <span class="action-item__tag">{{ a.tag }}</span>
          </div>
        </div>
      </section>

      <!-- 预警台账 -->
      <section class="warn-section">
        <h3 class="warn-section__title">就业预警台账</h3>
        <div class="warn-table-wrap">
          <table class="warn-table">
            <thead><tr><th>分类</th><th>预警项</th><th>等级</th></tr></thead>
            <tbody>
              <tr v-for="item in employmentItems" :key="item.id" :class="`row--${item.level}`">
                <td><span class="cat-badge">{{ item.category }}</span></td>
                <td class="cell-label">{{ item.label }}</td>
                <td><span class="level-badge" :class="`level-badge--${item.level}`">{{ item.levelLabel }}</span></td>
              </tr>
              <tr v-if="!employmentItems.length"><td colspan="3" class="empty-cell">暂无就业预警项</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 就业意向 -->
      <section class="warn-section">
        <h3 class="warn-section__title">就业意向与准备状态</h3>
        <div class="info-grid">
          <div class="info-item"><span class="info-item__label">意向城市</span><span class="info-item__value">{{ dashboard.careerDev?.targetCity ?? '未填报' }}</span></div>
          <div class="info-item"><span class="info-item__label">期望薪资</span><span class="info-item__value">{{ dashboard.careerDev?.expectedSalary ?? '未填报' }}</span></div>
          <div class="info-item"><span class="info-item__label">简历状态</span><span class="info-item__value">{{ dashboard.careerDev?.resumeStatus ?? '未完善' }}</span></div>
          <div class="info-item"><span class="info-item__label">项目经历</span><span class="info-item__value">{{ dashboard.careerDev?.projectExperiences?.length ?? 0 }} 项</span></div>
        </div>
      </section>

      <div class="footer-actions">
        <button type="button" class="footer-actions__btn" @click="goLedger">返回基础信息台账</button>
      </div>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.employment-warning {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  align-items: start;
}

.employment-warning > *:nth-child(1) { grid-column: 1 / -1; }
.employment-warning > *:nth-child(2) { grid-column: 1 / -1; }
.employment-warning > *:nth-child(3) { grid-column: 1; }
.employment-warning > *:nth-child(4) { grid-column: 2; }
.employment-warning > *:nth-child(5) { grid-column: 1 / -1; }
.employment-warning > *:nth-child(6) { grid-column: 1 / -1; }
.employment-warning > *:nth-child(7) { grid-column: 1 / -1; }

.warn-section {
  padding: 10px 14px;
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
}

.warn-section__title {
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

/* KPI */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.45);
  border-left: 3px solid #65dfff;

  &--low { border-color: #55e995; }
  &--medium { border-color: #facc15; }
  &--high { border-color: #ff7474; }

  &__label {
    font-size: 13px;
    color: #7eb4d8;
    font-weight: 600;
  }

  &__value {
    font-size: 20px;
    font-weight: 900;
    color: #f6fbff;

    &--small {
      font-size: 14px;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

/* Job match layout: left list + right detail */
.job-match-layout {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 10px;
  min-height: 200px;
}

.job-match-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.job-match-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  border: 1px solid rgba(102, 217, 255, 0.06);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover { background: rgba(0, 56, 100, 0.45); }
  &.is-active {
    border-color: rgba(0, 184, 255, 0.45);
    background: rgba(0, 74, 130, 0.4);
    box-shadow: 0 0 10px rgba(0, 184, 255, 0.12);
  }

  &__rank {
    font-size: 12px;
    padding: 1px 5px;
    border-radius: 999px;
    background: rgba(0, 184, 255, 0.12);
    color: #8ef6ff;
    font-weight: 700;
    white-space: nowrap;
  }

  &__role {
    font-size: 15px;
    font-weight: 700;
    color: #d0e8f8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__bar {
    display: none;
  }

  &__bar-inner {
    height: 100%;
    border-radius: 3px;
  }

  &__match {
    font-size: 15px;
    font-weight: 900;
    white-space: nowrap;
  }
}

.job-match-detail {
  padding: 12px 14px;
  border-radius: 5px;
  background: rgba(0, 38, 73, 0.4);
  border: 1px solid rgba(102, 217, 255, 0.12);
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__role {
    font-size: 18px;
    font-weight: 800;
    color: #f6fbff;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.1);
  }

  &__meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  &__kv {
    padding: 6px 8px;
    border-radius: 3px;
    background: rgba(0, 56, 100, 0.35);
    display: flex;
    flex-direction: column;
    gap: 2px;

    label {
      font-size: 13px;
      color: #7eb4d8;
      font-weight: 600;
    }

    strong {
      font-size: 18px;
      font-weight: 900;
      color: #f6fbff;
    }

    span {
      font-size: 15px;
      font-weight: 700;
      color: #d0e8f8;
    }
  }

  &__section {
    label {
      display: block;
      font-size: 14px;
      font-weight: 700;
      color: #7eb4d8;
      margin-bottom: 4px;
    }

    p {
      margin: 0;
      font-size: 14px;
      color: #c8dff0;
      line-height: 1.5;
    }
  }
}

/* Weakness */
.weakness-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.weakness-item {
  display: grid;
  grid-template-columns: 12px 100px 56px 1fr;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 14px;

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  &__label {
    color: #d0e8f8;
    font-weight: 700;
  }

  &__level {
    font-size: 13px;
    font-weight: 800;
  }

  &__desc {
    color: #9ecae8;
    text-align: right;
  }
}

/* Action plan */
.action-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 14px;

  &__time {
    width: 56px;
    color: #7eb4d8;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
    color: #d0e8f8;
    line-height: 1.4;
  }

  &__tag {
    font-size: 15px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(0, 184, 255, 0.12);
    color: #8ef6ff;
    font-weight: 700;
    flex-shrink: 0;
    min-width: 56px;
    text-align: center;
  }
}

/* Table */
.warn-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.warn-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
  color: rgba(184, 236, 255, 0.85);

  th {
    text-align: left;
    padding: 7px 10px;
    font-size: 14px;
    font-weight: 700;
    color: #9ecae8;
    border-bottom: 1px solid rgba(102, 217, 255, 0.12);
    white-space: nowrap;
  }

  td {
    padding: 7px 10px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.05);
  }

  tbody tr:hover { background: rgba(0, 184, 255, 0.04); }

  .row--low td:first-child { border-left: 2px solid rgba(74, 222, 128, 0.5); }
  .row--medium td:first-child { border-left: 2px solid rgba(250, 204, 21, 0.5); }
  .row--high td:first-child { border-left: 2px solid rgba(248, 91, 91, 0.5); }

  .cell-label {
    font-weight: 600;
    color: #d0e8f8;
    line-height: 1.4;
  }
}
.cat-badge {
  display: inline-block;
  font-weight: 700;
  font-size: 12px;
  padding: 1px 5px;
  border-radius: 999px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.12);
  color: #8ef6ff;
  white-space: nowrap;
}

.level-badge {
  font-size: 14px;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 700;
  display: inline-block;
  min-width: 56px;
  text-align: center;

  &--low { background: rgba(74, 222, 128, 0.12); color: #55e995; }
  &--medium { background: rgba(250, 204, 21, 0.12); color: #facc15; }
  &--high { background: rgba(248, 91, 91, 0.12); color: #ff7474; }
}

.empty-cell {
  padding: 16px;
  text-align: center;
  color: #5a7d96;
  font-size: 14px;
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.3);

  &__label {
    font-size: 13px;
    color: #7eb4d8;
  }

  &__value {
    font-size: 15px;
    font-weight: 800;
    color: #f6fbff;
  }
}

/* Footer */
.footer-actions {
  display: flex;
  justify-content: center;
  padding: 6px 0 12px;

  &__btn {
    padding: 7px 18px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.35);
    background: rgba(0, 184, 255, 0.1);
    color: #8ef6ff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background: rgba(0, 184, 255, 0.18);
      border-color: rgba(0, 184, 255, 0.6);
    }
  }
}

/* Placeholder */
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 320px;
  font-size: 15px;
  color: rgba(184, 236, 255, 0.7);

  &.error { color: #f87171; flex-direction: column; }

  button {
    padding: 4px 14px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.3);
    background: rgba(0, 184, 255, 0.1);
    color: #55dfff;
    cursor: pointer;
    font-size: 15px;

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

@media (max-width: 1280px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .job-match-layout { grid-template-columns: 1fr; }
  .info-grid { grid-template-columns: repeat(2, 1fr); }
  .weakness-item { grid-template-columns: 12px 80px 48px 1fr; }
}
</style>
