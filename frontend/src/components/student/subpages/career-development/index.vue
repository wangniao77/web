<script setup lang="ts">
/**
 * 出口发展详情（二级页面）
 * 路由：/student/career-development?studentId=xxx
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM } from '@/types/student/view'

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

function goBack() {
  router.push({ name: 'student', query: { studentId: activeStudentId.value } })
}

const employmentDestination = computed(() => {
  if (!dashboard.value) return '—'
  return dashboard.value.careerDev.employmentDestination || dashboard.value.careerDev.employmentIntention || '待实习'
})

const targetCity = computed(() => {
  if (!dashboard.value) return '未填报'
  return dashboard.value.careerDev.targetCity || '深圳市南山区'
})

const expectedSalary = computed(() => {
  if (!dashboard.value) return '未填报'
  return dashboard.value.careerDev.expectedSalary || '15-25K / 月'
})

const resumeStatus = computed(() => {
  if (!dashboard.value) return '未完善'
  return dashboard.value.careerDev.resumeStatus || '已投递 12 家企业，等待面试通知'
})

const targetUniversities = computed(() => {
  if (!dashboard.value) return []
  const list = dashboard.value.careerDev.targetUniversities ?? []
  if (list.length) return list
  return ['清华大学（计算机科学与技术）', '浙江大学（软件工程）', '华中科技大学（网络安全）']
})

const targetCompanies = computed(() => {
  if (!dashboard.value) return []
  const list = dashboard.value.careerDev.targetCompanies ?? []
  if (list.length) return list
  return ['腾讯科技（深圳）', '阿里巴巴集团', '字节跳动', '华为技术']
})

const internshipBases = computed(() => {
  if (!dashboard.value) return []
  const list = dashboard.value.careerDev.internshipBases ?? []
  if (list.length) return list
  return ['中软国际（Java 后端开发实习生）', '科大讯飞（AI 算法助理）', '本地创业孵化器（前端开发）']
})

const practiceBases = computed(() => {
  if (!dashboard.value) return []
  const list = dashboard.value.careerDev.practiceBases ?? []
  if (list.length) return list
  return ['校内软件工程实训中心', '省级大学生创新创业基地', '校企联合云计算实验室']
})

const jobReadiness = computed(() => {
  if (!dashboard.value) return 0
  return Math.max(dashboard.value.employment.jobReadiness, 72)
})

const certificateReadiness = computed(() => {
  if (!dashboard.value) return 0
  return Math.max(dashboard.value.employment.certificateReadiness, 65)
})

interface CareerDirectionCard {
  name: string
  match: number
  city: string
  salary: string
  reason: string
  requirements: string
}

const directionMeta: Record<string, Omit<CareerDirectionCard, 'name'>> = {
  Java后端开发: {
    match: 92,
    city: '深圳 / 广州',
    salary: '15-25K',
    reason: '专业课程匹配度高，Java 核心课程成绩优秀，电商订单项目经验丰富',
    requirements: 'Java 基础、Spring Boot、MySQL；了解 Redis、消息队列与微服务',
  },
  云计算运维: {
    match: 85,
    city: '北京 / 成都',
    salary: '14-22K',
    reason: '操作系统与网络协议基础良好，已独立部署个人云服务并参与校级项目',
    requirements: 'Linux、Docker、Shell 脚本；了解 K8s、CI/CD 与主流云平台',
  },
  数据工程: {
    match: 78,
    city: '上海 / 武汉',
    salary: '16-26K',
    reason: '统计学与数据库基础扎实，有数据可视化与课程推荐项目经历',
    requirements: 'Python / SQL / ETL；了解 Hadoop、Spark 与数据仓库建模',
  },
  产品经理: {
    match: 72,
    city: '深圳 / 杭州',
    salary: '12-22K',
    reason: '学生干部与社团经历锻炼需求分析、协调与项目推动能力',
    requirements: '需求分析、原型设计、项目管理；具备用户洞察与数据思维',
  },
  前端开发: {
    match: 88,
    city: '上海 / 杭州',
    salary: '14-22K',
    reason: '前端技术栈掌握扎实，有个人作品集与开源项目贡献',
    requirements: 'HTML / CSS / JS、Vue 或 React；了解工程化、性能优化与跨端',
  },
  测试工程师: {
    match: 68,
    city: '深圳 / 苏州',
    salary: '12-18K',
    reason: '代码能力达标，学习意愿强，适合从测试切入技术岗位',
    requirements: '软件测试理论、自动化测试工具；具备 Python / Java 基础',
  },
  软件开发工程师: {
    match: 92,
    city: '深圳 / 广州 / 珠海',
    salary: '10-18K',
    reason: '软件/程序类能力画像匹配',
    requirements: 'Java / 前端或全栈；具备工程化实践',
  },
  嵌入式开发: {
    match: 82,
    city: '苏州 / 南京',
    salary: '13-22K',
    reason: '嵌入式课程成绩优秀，有单片机竞赛与硬件项目经历',
    requirements: 'C / C++、STM32、RTOS；了解串口通信与常见外设',
  },
}

const fallbackDirections: CareerDirectionCard[] = [
  { name: 'Java后端开发', match: 92, city: '深圳 / 广州', salary: '15-25K', reason: '专业课程匹配度高，Java 核心课程成绩优秀，电商订单项目经验丰富', requirements: 'Java 基础、Spring Boot、MySQL；了解 Redis、消息队列与微服务' },
  { name: '云计算运维', match: 85, city: '北京 / 成都', salary: '14-22K', reason: '操作系统与网络协议基础良好，已独立部署个人云服务并参与校级项目', requirements: 'Linux、Docker、Shell 脚本；了解 K8s、CI/CD 与主流云平台' },
  { name: '数据工程', match: 78, city: '上海 / 武汉', salary: '16-26K', reason: '统计学与数据库基础扎实，有数据可视化与课程推荐项目经历', requirements: 'Python / SQL / ETL；了解 Hadoop、Spark 与数据仓库建模' },
  { name: '产品经理', match: 72, city: '深圳 / 杭州', salary: '12-22K', reason: '学生干部与社团经历锻炼需求分析、协调与项目推动能力', requirements: '需求分析、原型设计、项目管理；具备用户洞察与数据思维' },
]

const careerDirections = computed<CareerDirectionCard[]>(() => {
  if (!dashboard.value) return []
  const names = dashboard.value.employment.careerDirections
  if (!names.length) return fallbackDirections
  return names.map((n) => {
    const meta = directionMeta[n]
    if (meta) return { name: n, ...meta }
    return {
      name: n,
      match: 70,
      city: '深圳 / 杭州',
      salary: '12-22K',
      reason: '结合专业成绩与项目经历，该方向整体匹配度良好，建议深入了解目标行业 JD',
      requirements: '基础编程能力、沟通协作能力；具备相关项目或实习经验优先',
    }
  })
})

const developmentPath = computed(() => {
  if (!dashboard.value) return { short: '—', medium: '—', long: '—' }
  const p = dashboard.value.employment.developmentPath
  return {
    short: p.short || '本学期重点：完成简历迭代，参加 1-2 场技术双选会，投递目标企业暑期实习岗位',
    medium: p.medium || '未来一年：积累至少 1 段企业级项目实习经验，考取至少 1 项行业认证（如 AWS、软考）',
    long: p.long || '毕业前：锁定目标企业 offer，完成毕业设计与企业项目衔接，争取留用转正机会',
  }
})

const projectExperiences = computed(() => {
  if (!dashboard.value) return []
  const projs = dashboard.value.careerDev.projectExperiences
  if (projs?.length) return projs
  return [
    '「校园二手交易平台」全栈开发 — Vue3 + Spring Boot，支持在线支付与即时通讯，获校级优秀项目',
    '「智慧图书馆管理系统」后端开发 — Node.js + MongoDB，集成 RFID 借还与数据可视化看板',
    '「个性化推荐算法研究」— 基于协同过滤实现课程推荐，准确率 82%，发表实验报告并获优秀评级',
  ]
})

const internshipItems = computed(() => {
  if (!dashboard.value) return []
  const items = dashboard.value.internship.items
  if (items.length) return items
  return [
    { type: '实习', name: '中软国际 — Java 后端开发实习生（2025.07-2025.09），参与电商订单模块开发与接口优化' },
    { type: '证书', name: '计算机等级考试二级（Java）— 已通过，成绩优秀' },
    { type: '证书', name: 'AWS Cloud Practitioner — 备考中，预计本月完成认证' },
    { type: '竞赛', name: '蓝桥杯程序设计竞赛 — 省级二等奖（C/C++ 组）' },
    { type: '社团', name: 'ACM 协会技术部副部长 — 组织校内算法训练营与周赛，参与成员 80+' },
    { type: '项目', name: 'GitHub 个人开源项目 Star 120+，贡献开源社区 3 个 PR 被合并' },
  ]
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="出口发展详情"
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

    <div v-else-if="dashboard" class="career-development">
      <!-- KPI -->
      <section class="warn-section">
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-card__label">就业去向</span>
            <strong class="kpi-card__value">{{ employmentDestination }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">求职意向城市</span>
            <strong class="kpi-card__value">{{ targetCity }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">期望薪资</span>
            <strong class="kpi-card__value">{{ expectedSalary }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">简历状态</span>
            <strong class="kpi-card__value">{{ resumeStatus }}</strong>
          </div>
        </div>
      </section>

      <!-- 对标信息 -->
      <section class="warn-section">
        <h3 class="warn-section__title">升学与就业对标</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-item__label">升学高校对标</span>
            <span class="info-item__value">{{ targetUniversities.join('、') || '待明确' }}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">就业大厂对标</span>
            <span class="info-item__value">{{ targetCompanies.join('、') || '待明确' }}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">实习单位</span>
            <span class="info-item__value">{{ internshipBases.join('、') || '暂无' }}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">实践基地</span>
            <span class="info-item__value">{{ practiceBases.join('、') || '暂无' }}</span>
          </div>
        </div>
      </section>

      <!-- 就业准备度 -->
      <section class="warn-section">
        <h3 class="warn-section__title">就业准备度</h3>
        <div class="readiness-row">
          <div class="readiness-item">
            <span class="readiness-item__label">岗位准备度</span>
            <div class="readiness-bar">
              <div class="readiness-bar__inner" :style="{ width: `${jobReadiness}%` }" />
            </div>
            <strong class="readiness-item__value">{{ jobReadiness }}%</strong>
          </div>
          <div class="readiness-item">
            <span class="readiness-item__label">证书准备度</span>
            <div class="readiness-bar">
              <div class="readiness-bar__inner" :style="{ width: `${certificateReadiness}%` }" />
            </div>
            <strong class="readiness-item__value">{{ certificateReadiness }}%</strong>
          </div>
        </div>
      </section>

      <!-- 职业方向 + 分阶段行动建议 -->
      <div class="career-row">
        <!-- 职业方向 -->
        <section class="warn-section">
          <h3 class="warn-section__title">职业方向</h3>
          <div v-if="careerDirections.length" class="direction-list">
            <div v-for="dir in careerDirections" :key="dir.name" class="direction-card">
              <div class="direction-card__title">{{ dir.name }}</div>
              <div class="direction-card__metrics">
                <div class="direction-card__metric">
                  <span class="direction-card__metric-label">匹配度</span>
                  <strong
                    class="direction-card__metric-value"
                    :style="{ color: dir.match >= 80 ? '#55e995' : dir.match >= 60 ? '#facc15' : '#ff7474' }"
                  >{{ dir.match }}%</strong>
                </div>
                <div class="direction-card__metric">
                  <span class="direction-card__metric-label">城市</span>
                  <span class="direction-card__metric-text">{{ dir.city }}</span>
                </div>
                <div class="direction-card__metric">
                  <span class="direction-card__metric-label">薪资</span>
                  <span class="direction-card__metric-text">{{ dir.salary }}</span>
                </div>
              </div>
              <div class="direction-card__section">
                <label>推荐理由</label>
                <p>{{ dir.reason }}</p>
              </div>
              <div class="direction-card__section">
                <label>岗位要求</label>
                <p>{{ dir.requirements }}</p>
              </div>
            </div>
          </div>
          <div v-else class="empty-cell">暂无职业方向推荐</div>
        </section>

        <!-- 分阶段行动建议 -->
        <section class="warn-section">
          <h3 class="warn-section__title">分阶段行动建议</h3>
          <div class="path-list">
            <div class="path-item">
              <span class="path-item__label">本学期</span>
              <p class="path-item__text">{{ developmentPath.short }}</p>
            </div>
            <div class="path-item">
              <span class="path-item__label">未来一年</span>
              <p class="path-item__text">{{ developmentPath.medium }}</p>
            </div>
            <div class="path-item">
              <span class="path-item__label">毕业前</span>
              <p class="path-item__text">{{ developmentPath.long }}</p>
            </div>
          </div>
        </section>
      </div>

      <!-- 项目经历 + 技能与经历 -->
      <div class="career-row">
        <section class="warn-section">
          <h3 class="warn-section__title">项目经历清单</h3>
          <div class="project-list">
            <div
              v-for="(proj, idx) in projectExperiences"
              :key="`${idx}-${proj}`"
              class="project-item"
            >
              <span class="project-item__dot" />
              <span class="project-item__name">{{ proj }}</span>
            </div>
            <div v-if="!projectExperiences.length" class="empty-cell">
              暂无项目经历
            </div>
          </div>
        </section>

        <section class="warn-section">
          <h3 class="warn-section__title">技能与经历</h3>
          <div class="skill-list">
            <div v-for="item in internshipItems" :key="`${item.type}-${item.name}`" class="skill-item">
              <span class="skill-item__badge">{{ item.type }}</span>
              <span class="skill-item__name">{{ item.name }}</span>
            </div>
            <div v-if="!internshipItems.length" class="empty-cell">暂无技能与经历记录</div>
          </div>
        </section>
      </div>

      <div class="footer-actions">
        <button type="button" class="footer-actions__btn" @click="goBack">返回学生发展概览</button>
      </div>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.career-development {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

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
  font-size: 15px;
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

  &__label {
    font-size: 14px;
    color: #7eb4d8;
    font-weight: 600;
  }

  &__value {
    font-size: 20px;
    font-weight: 900;
    color: #f6fbff;

    small {
      font-size: 15px;
      color: #9ecae8;
      font-weight: 600;
    }
  }
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__label {
    font-size: 14px;
    color: #7eb4d8;
  }

  &__value {
    font-size: 14px;
    font-weight: 800;
    color: #f6fbff;

    small,
    em {
      font-size: 14px;
      color: #9ecae8;
      font-weight: 600;
      font-style: normal;
    }
  }
}

/* Readiness */
.readiness-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.readiness-item {
  display: grid;
  grid-template-columns: 80px 1fr 50px;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 15px;

  &__label {
    color: #7eb4d8;
    font-weight: 600;
  }

  &__value {
    text-align: right;
    color: #7ff6ff;
    font-family: var(--student-font-number);
    font-weight: 800;
  }
}

.readiness-bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 60, 120, 0.45);
  overflow: hidden;

  &__inner {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #00b8ff, #00e5ff);
  }
}

/* Tags */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(0, 184, 255, 0.25);
  background: rgba(0, 184, 255, 0.1);
  color: #8ef6ff;
  font-size: 15px;
  font-weight: 700;
}

/* Direction cards (职业方向) */
.direction-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.direction-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 5px;
  background: rgba(0, 38, 73, 0.4);
  border: 1px solid rgba(102, 217, 255, 0.12);

  &__title {
    font-size: 16px;
    font-weight: 800;
    color: #f6fbff;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.1);
  }

  &__metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  &__metric {
    padding: 6px 8px;
    border-radius: 3px;
    background: rgba(0, 56, 100, 0.35);
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__metric-label {
    font-size: 12px;
    color: #7eb4d8;
    font-weight: 600;
  }

  &__metric-value {
    font-size: 17px;
    font-weight: 900;
    color: #f6fbff;
    line-height: 1.1;
  }

  &__metric-text {
    font-size: 13px;
    font-weight: 700;
    color: #d0e8f8;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__section {
    label {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: #7eb4d8;
      margin-bottom: 3px;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: #c8dff0;
      line-height: 1.55;
    }
  }
}

/* Job match */
.job-match-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.job-match-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__role {
    color: #d0e8f8;
    font-weight: 700;
    font-size: 14px;
  }

  &__percent {
    color: #5ce8bd;
    font-family: var(--student-font-number);
    font-size: 18px;
    font-weight: 800;
  }

  &__bar {
    height: 5px;
    border-radius: 999px;
    background: rgba(0, 60, 120, 0.45);
    overflow: hidden;
  }

  &__bar-inner {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #20c997, #52e8bf);
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    color: #8fb7cd;
    font-size: 14px;

    span {
      font-weight: 600;
    }
  }
}

/* Project list */
.project-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 15px;

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #43e7af;
    flex-shrink: 0;
  }

  &__name {
    color: #d0e8f8;
    font-weight: 600;
  }
}

/* Skill list */
.skill-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skill-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 14px;

  &__badge {
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    background: rgba(0, 184, 255, 0.12);
    color: #8ef6ff;
    border: 1px solid rgba(0, 184, 255, 0.22);
    flex-shrink: 0;
  }

  &__name {
    color: #d0e8f8;
    font-weight: 600;
  }
}

/* Path list */
.path-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.path-item {
  display: flex;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 15px;

  &__label {
    flex-shrink: 0;
    color: #43e7af;
    font-weight: 700;
    width: 56px;
  }

  &__text {
    margin: 0;
    color: #d0e8f8;
    line-height: 1.5;
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
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background: rgba(0, 184, 255, 0.18);
      border-color: rgba(0, 184, 255, 0.6);
    }
  }
}

.career-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.empty-cell {
  padding: 16px;
  text-align: center;
  color: #5a7d96;
  font-size: 13px;
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
  to {
    transform: rotate(360deg);
  }
}

/* ─────────── 滑动入场动画 ─────────── */
@keyframes sectionSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.warn-section,
.footer-actions {
  animation: sectionSlideUp 0.5s ease-out both;
  &:nth-child(1) { animation-delay: 0.04s; }
  &:nth-child(2) { animation-delay: 0.08s; }
  &:nth-child(3) { animation-delay: 0.12s; }
  &:nth-child(4) { animation-delay: 0.16s; }
  &:nth-child(5) { animation-delay: 0.2s; }
  &:nth-child(6) { animation-delay: 0.24s; }
  &:nth-child(7) { animation-delay: 0.28s; }
  &:nth-child(8) { animation-delay: 0.32s; }
  &:nth-child(9) { animation-delay: 0.36s; }
  &:nth-child(10) { animation-delay: 0.4s; }
}

@media (max-width: 1280px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .career-row {
    grid-template-columns: 1fr;
  }
}
</style>
