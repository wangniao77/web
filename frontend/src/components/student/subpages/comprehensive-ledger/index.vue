<script setup lang="ts">
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

const activeTab = ref<'honor' | 'discipline'>('honor')
const activeDisciplineSub = ref(0)

const disciplineTabs = [
  { label: '校纪处分', key: 'disciplinary' },
  { label: '通报批评', key: 'criticism' },
  { label: '学业警示', key: 'warning' },
  { label: '诚信档案', key: 'integrity' },
]

/* ─────────── 荣誉成果 mock data（展示完整字段结构） ─────────── */

const competitionRecords = [
  {
    name: '全国大学生数学建模竞赛',
    level: '国家级',
    awardLevel: '一等奖',
    type: '学科类',
    track: '大数据方向',
    role: '队长',
    members: '张三、李四、王五',
    organizer: '中国工业与应用数学学会',
    date: '2024-09',
    advisor: '陈教授',
    evidence: '获奖证书.pdf',
  },
  {
    name: '中国国际“互联网+”大学生创新创业大赛',
    level: '省级',
    awardLevel: '金奖',
    type: '双创类',
    track: '人工智能方向',
    role: '第二参加人',
    members: '赵六、张三、孙七',
    organizer: '广东省教育厅',
    date: '2024-06',
    advisor: '李教授',
    evidence: '获奖证书.pdf',
  },
]

const researchProjects = [
  {
    name: '基于深度学习的金融时序预测模型研究',
    number: '2024A001',
    source: '国家级大创',
    level: '国家级',
    role: '项目主持人',
    status: '在研',
    startDate: '2024-03',
    endDate: '—',
    advisor: '王教授',
    members: '张三（负责人）、李四、王五',
    evidence: '立项通知书.pdf',
  },
]

const researchPapers = [
  {
    title: '基于Transformer的时间序列预测方法综述',
    venue: '《计算机学报》',
    venueLevel: 'CCF A类',
    index: 'SCI收录',
    authorOrder: '第一作者',
    date: '2024-05',
    doi: '10.1234/abc123',
    advisor: '陈教授',
    coAuthors: '张三（广工）、李四（清华）',
    evidence: '论文全文.pdf',
  },
]

const patents = [
  {
    name: '一种基于AI的图像识别系统',
    type: '软件著作权',
    applyNumber: '2024SR123456',
    patentNumber: '—',
    authDate: '2024-08-15',
    inventorOrder: '第一发明人',
    owner: '广东工业大学',
    advisor: '刘教授',
    evidence: '登记证书.pdf',
  },
]

const otherAchievements = [
  {
    type: '会议报告',
    name: '深度学习在金融风控中的应用',
    eventName: 'IEEE 国际数据科学会议',
    eventLevel: '国际会议',
    platform: '会议论文集',
    authorOrder: '第一完成人',
    form: '口头报告',
    date: '2024-11',
    evidence: '会议议程.pdf',
  },
]

const honorTitles = [
  {
    name: '2024-2025学年三好学生',
    grantor: '学校',
    level: '校级',
    period: '2024-2025学年第一学期',
    date: '2024-09-10',
    certNumber: '—',
    evidence: '荣誉证书.pdf',
  },
]

const scholarshipRecords = [
  {
    name: '国家励志奖学金',
    level: '国家级',
    year: '2024-2025学年',
    date: '2024-10-15',
    grantor: '教育部',
    amount: '5000',
    certNumber: '—',
    evidence: '获奖证书.pdf',
  },
]

const practiceRecords = [
  {
    name: '暑期三下乡社会实践优秀团队',
    type: '社会实践',
    organizer: '校团委',
    level: '校级',
    hours: '120',
    location: '乡村',
    period: '2024-07-01 至 2024-07-15',
    role: '负责人',
    summary: '大数据调研、AI公益服务',
    evidence: '实践证明.pdf',
  },
]

const artRecords = [
  {
    name: '校运动会男子100米冠军',
    level: '校级',
    award: '第1名',
    date: '2024-05',
    organizer: '体育部',
    evidence: '获奖证书.pdf',
  },
]

const collectiveRecords = [
  {
    name: '省级先进班集体',
    level: '省级',
    date: '2024-06',
    grantor: '广东省教育厅',
    members: '张三、李四、王五等30人',
    contribution: '班级骨干，贡献度20%',
    evidence: '获奖文件.pdf',
  },
]

const skillCertificates = [
  {
    name: '全国计算机等级考试三级（数据库技术）',
    issuer: '教育部考试中心',
    date: '2024-03',
    number: '—',
    evidence: '证书扫描件.pdf',
  },
]

/* ─────────── 纪律处分 mock data ─────────── */

const disciplinaryRecords = [
  {
    type: '警告',
    reason: '考试作弊',
    docNumber: '校学〔2024〕001号',
    unit: '学生工作部',
    date: '2024-03-15',
    period: '6个月',
    status: '已解除',
    requirement: '认真反省，诚信考试',
    evidence: '处分决定书.pdf',
  },
]

const criticismRecords = [
  {
    reason: '无故旷课累计10学时',
    scope: '学院通报',
    unit: '学院学工办',
    date: '2024-04-10',
    requirement: '限期补齐考勤',
    evidence: '通报文件.pdf',
  },
]

const academicWarnings = [
  {
    type: '挂科过多预警',
    target: '高等数学、线性代数',
    count: '2',
    measure: '学业谈话、强制辅导',
    deduction: '—',
    date: '2024-07-01',
    recorder: '辅导员',
  },
]

const integrityRecords = [
  {
    type: '图书馆借书超期',
    detail: '图书馆借书超期3个月未还',
    amount: '—',
    status: '已结清',
    result: '已归还图书',
    date: '2024-02-15',
    evidence: '图书馆罚单.pdf',
  },
]

const disciplineLevel = computed(() => {
  if (!dashboard.value) return 'low'
  const count = dashboard.value.quality.disciplineRecords.length
  if (count >= 2) return 'high'
  if (count === 1) return 'medium'
  return 'low'
})

const overallTopPercent = computed(() => {
  if (!dashboard.value) return '—'
  const d = dashboard.value.growthOverview
  if (!d.overallTotal) return '—'
  return `${Math.max(1, Math.round((d.overallRank / d.overallTotal) * 100))}`
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="综合素养台账详情"
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

    <div v-else-if="dashboard" class="comprehensive-ledger">
      <!-- KPI -->
      <section class="warn-section">
        <div class="kpi-grid">
          <div class="kpi-card" :class="`kpi-card--${disciplineLevel}`">
            <span class="kpi-card__label">纪律风险等级</span>
            <strong class="kpi-card__value">{{ disciplineLevel === 'high' ? '高危' : disciplineLevel === 'medium' ? '需关注' : '正常' }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">综测排名</span>
            <strong class="kpi-card__value">{{ dashboard.growthOverview.overallRank }}<small>/{{ dashboard.growthOverview.overallTotal }}</small></strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">奖学金</span>
            <strong class="kpi-card__value">{{ dashboard.scholarships.length }}<small>项</small></strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">竞赛获奖</span>
            <strong class="kpi-card__value">{{ dashboard.competition.awardCount }}<small>项</small></strong>
          </div>
        </div>
      </section>

      <!-- 主 Tab -->
      <div class="ledger-tabs">
        <button
          class="ledger-tab"
          :class="{ 'ledger-tab--active': activeTab === 'honor' }"
          @click="activeTab = 'honor'"
        >
          荣誉成果
        </button>
        <button
          class="ledger-tab"
          :class="{ 'ledger-tab--active': activeTab === 'discipline' }"
          @click="activeTab = 'discipline'"
        >
          纪律处分
        </button>
      </div>

      <!-- 荣誉成果 -->
      <div v-if="activeTab === 'honor'" class="tab-content">


        <div class="honor-grid">
          <!-- 学科竞赛 -->
          <div class="sub-panel">
          <h4 class="sub-panel__title">学科竞赛获奖记录</h4>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>竞赛名称</th>
                  <th>竞赛级别</th>
                  <th>获奖等级</th>
                  <th>竞赛类型</th>
                  <th>竞赛赛道</th>
                  <th>参赛角色</th>
                  <th>团队成员</th>
                  <th>主办单位</th>
                  <th>获奖时间</th>
                  <th>指导教师</th>
                  <th>佐证材料</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in competitionRecords" :key="r.name">
                  <td>{{ r.name }}</td>
                  <td>{{ r.level }}</td>
                  <td>{{ r.awardLevel }}</td>
                  <td>{{ r.type }}</td>
                  <td>{{ r.track }}</td>
                  <td>{{ r.role }}</td>
                  <td>{{ r.members }}</td>
                  <td>{{ r.organizer }}</td>
                  <td>{{ r.date }}</td>
                  <td>{{ r.advisor }}</td>
                  <td><a class="evidence-link" href="#">{{ r.evidence }}</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 科研项目 -->
        <div class="sub-panel">
          <h4 class="sub-panel__title">科研与创新创业项目</h4>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>项目名称</th>
                  <th>项目编号</th>
                  <th>来源/类型</th>
                  <th>项目级别</th>
                  <th>担任角色</th>
                  <th>项目状态</th>
                  <th>立项时间</th>
                  <th>结题时间</th>
                  <th>指导教师</th>
                  <th>项目成员</th>
                  <th>佐证材料</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in researchProjects" :key="r.name">
                  <td>{{ r.name }}</td>
                  <td>{{ r.number }}</td>
                  <td>{{ r.source }}</td>
                  <td>{{ r.level }}</td>
                  <td>{{ r.role }}</td>
                  <td>{{ r.status }}</td>
                  <td>{{ r.startDate }}</td>
                  <td>{{ r.endDate }}</td>
                  <td>{{ r.advisor }}</td>
                  <td>{{ r.members }}</td>
                  <td><a class="evidence-link" href="#">{{ r.evidence }}</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 学术论文 -->
        <div class="sub-panel">
          <h4 class="sub-panel__title">学术论文发表记录</h4>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>论文题目</th>
                  <th>发表刊物/会议</th>
                  <th>刊物/会议级别</th>
                  <th>收录/检索</th>
                  <th>作者排序</th>
                  <th>发表时间</th>
                  <th>DOI编号</th>
                  <th>指导老师</th>
                  <th>合作者</th>
                  <th>佐证材料</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in researchPapers" :key="r.title">
                  <td>{{ r.title }}</td>
                  <td>{{ r.venue }}</td>
                  <td>{{ r.venueLevel }}</td>
                  <td>{{ r.index }}</td>
                  <td>{{ r.authorOrder }}</td>
                  <td>{{ r.date }}</td>
                  <td>{{ r.doi }}</td>
                  <td>{{ r.advisor }}</td>
                  <td>{{ r.coAuthors }}</td>
                  <td><a class="evidence-link" href="#">{{ r.evidence }}</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 专利软著 -->
        <div class="sub-panel">
          <h4 class="sub-panel__title">专利与软件著作权</h4>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>知识产权名称</th>
                  <th>知识产权类型</th>
                  <th>申请/登记号</th>
                  <th>专利号</th>
                  <th>授权/登记时间</th>
                  <th>发明人/设计人排序</th>
                  <th>专利权人/著作权人</th>
                  <th>指导老师</th>
                  <th>佐证材料</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in patents" :key="r.name">
                  <td>{{ r.name }}</td>
                  <td>{{ r.type }}</td>
                  <td>{{ r.applyNumber }}</td>
                  <td>{{ r.patentNumber }}</td>
                  <td>{{ r.authDate }}</td>
                  <td>{{ r.inventorOrder }}</td>
                  <td>{{ r.owner }}</td>
                  <td>{{ r.advisor }}</td>
                  <td><a class="evidence-link" href="#">{{ r.evidence }}</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 其他成果 -->
        <div class="sub-panel">
          <h4 class="sub-panel__title">其他学术成果</h4>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>成果类型</th>
                  <th>成果名称</th>
                  <th>会议/活动名称</th>
                  <th>会议级别</th>
                  <th>成果发布平台</th>
                  <th>完成人排序</th>
                  <th>汇报形式</th>
                  <th>成果时间</th>
                  <th>佐证材料</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in otherAchievements" :key="r.name">
                  <td>{{ r.type }}</td>
                  <td>{{ r.name }}</td>
                  <td>{{ r.eventName }}</td>
                  <td>{{ r.eventLevel }}</td>
                  <td>{{ r.platform }}</td>
                  <td>{{ r.authorOrder }}</td>
                  <td>{{ r.form }}</td>
                  <td>{{ r.date }}</td>
                  <td><a class="evidence-link" href="#">{{ r.evidence }}</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 荣誉称号 -->
        <div class="sub-panel">
          <h4 class="sub-panel__title">荣誉称号记录</h4>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>荣誉称号名称</th>
                  <th>授予单位</th>
                  <th>荣誉等级</th>
                  <th>授予学年/学期</th>
                  <th>获得时间</th>
                  <th>证书编号</th>
                  <th>佐证材料</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in honorTitles" :key="r.name">
                  <td>{{ r.name }}</td>
                  <td>{{ r.grantor }}</td>
                  <td>{{ r.level }}</td>
                  <td>{{ r.period }}</td>
                  <td>{{ r.date }}</td>
                  <td>{{ r.certNumber }}</td>
                  <td><a class="evidence-link" href="#">{{ r.evidence }}</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 奖学金 -->
        <div class="sub-panel">
          <h4 class="sub-panel__title">奖学金获奖记录</h4>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>奖学金名称</th>
                  <th>奖学金等级</th>
                  <th>获奖学年</th>
                  <th>获奖时间</th>
                  <th>颁奖单位</th>
                  <th>奖金金额</th>
                  <th>证书编号</th>
                  <th>佐证材料</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in scholarshipRecords" :key="r.name">
                  <td>{{ r.name }}</td>
                  <td>{{ r.level }}</td>
                  <td>{{ r.year }}</td>
                  <td>{{ r.date }}</td>
                  <td>{{ r.grantor }}</td>
                  <td>{{ r.amount }} 元</td>
                  <td>{{ r.certNumber }}</td>
                  <td><a class="evidence-link" href="#">{{ r.evidence }}</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 社会实践 -->
        <div class="sub-panel">
          <h4 class="sub-panel__title">社会实践与志愿服务</h4>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>活动/荣誉名称</th>
                  <th>实践类型</th>
                  <th>组织单位</th>
                  <th>活动级别</th>
                  <th>服务总时长</th>
                  <th>服务地点</th>
                  <th>活动时间</th>
                  <th>担任角色</th>
                  <th>实践内容简述</th>
                  <th>佐证材料</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in practiceRecords" :key="r.name">
                  <td>{{ r.name }}</td>
                  <td>{{ r.type }}</td>
                  <td>{{ r.organizer }}</td>
                  <td>{{ r.level }}</td>
                  <td>{{ r.hours }} 小时</td>
                  <td>{{ r.location }}</td>
                  <td>{{ r.period }}</td>
                  <td>{{ r.role }}</td>
                  <td>{{ r.summary }}</td>
                  <td><a class="evidence-link" href="#">{{ r.evidence }}</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 文体艺术 -->
        <div class="sub-panel">
          <h4 class="sub-panel__title">文体艺术荣誉</h4>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>荣誉名称</th>
                  <th>活动级别</th>
                  <th>获奖等级/名次</th>
                  <th>活动时间</th>
                  <th>组织单位</th>
                  <th>佐证材料</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in artRecords" :key="r.name">
                  <td>{{ r.name }}</td>
                  <td>{{ r.level }}</td>
                  <td>{{ r.award }}</td>
                  <td>{{ r.date }}</td>
                  <td>{{ r.organizer }}</td>
                  <td><a class="evidence-link" href="#">{{ r.evidence }}</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 集体荣誉 -->
        <div class="sub-panel">
          <h4 class="sub-panel__title">集体荣誉记录</h4>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>集体荣誉名称</th>
                  <th>荣誉级别</th>
                  <th>获奖时间</th>
                  <th>授予单位</th>
                  <th>成员名单</th>
                  <th>个人贡献度</th>
                  <th>佐证材料</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in collectiveRecords" :key="r.name">
                  <td>{{ r.name }}</td>
                  <td>{{ r.level }}</td>
                  <td>{{ r.date }}</td>
                  <td>{{ r.grantor }}</td>
                  <td>{{ r.members }}</td>
                  <td>{{ r.contribution }}</td>
                  <td><a class="evidence-link" href="#">{{ r.evidence }}</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 技能证书 -->
        <div class="sub-panel">
          <h4 class="sub-panel__title">技能证书记录</h4>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>证书名称</th>
                  <th>发证机构</th>
                  <th>获得时间</th>
                  <th>证书编号</th>
                  <th>佐证材料</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in skillCertificates" :key="r.name">
                  <td>{{ r.name }}</td>
                  <td>{{ r.issuer }}</td>
                  <td>{{ r.date }}</td>
                  <td>{{ r.number }}</td>
                  <td><a class="evidence-link" href="#">{{ r.evidence }}</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>

      <!-- 纪律处分 -->
      <div v-if="activeTab === 'discipline'" class="tab-content">
        <div class="sub-tabs">
          <button
            v-for="(t, i) in disciplineTabs"
            :key="t.key"
            class="sub-tab"
            :class="{ 'sub-tab--active': activeDisciplineSub === i }"
            @click="activeDisciplineSub = i"
          >
            {{ t.label }}
          </button>
        </div>

        <!-- 校纪处分 -->
        <div v-if="activeDisciplineSub === 0" class="sub-panel">
          <h4 class="sub-panel__title">校纪处分记录</h4>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>处分类型</th>
                  <th>处分事由</th>
                  <th>处分文号</th>
                  <th>处分单位</th>
                  <th>处分时间</th>
                  <th>处分期限</th>
                  <th>解除状态</th>
                  <th>整改要求</th>
                  <th>佐证材料</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in disciplinaryRecords" :key="r.docNumber">
                  <td>{{ r.type }}</td>
                  <td>{{ r.reason }}</td>
                  <td>{{ r.docNumber }}</td>
                  <td>{{ r.unit }}</td>
                  <td>{{ r.date }}</td>
                  <td>{{ r.period }}</td>
                  <td>{{ r.status }}</td>
                  <td>{{ r.requirement }}</td>
                  <td><a class="evidence-link" href="#">{{ r.evidence }}</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 通报批评 -->
        <div v-if="activeDisciplineSub === 1" class="sub-panel">
          <h4 class="sub-panel__title">通报批评记录</h4>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>通报事由</th>
                  <th>通报范围</th>
                  <th>下达单位</th>
                  <th>通报时间</th>
                  <th>整改要求</th>
                  <th>佐证材料</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in criticismRecords" :key="r.date">
                  <td>{{ r.reason }}</td>
                  <td>{{ r.scope }}</td>
                  <td>{{ r.unit }}</td>
                  <td>{{ r.date }}</td>
                  <td>{{ r.requirement }}</td>
                  <td><a class="evidence-link" href="#">{{ r.evidence }}</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 学业警示 -->
        <div v-if="activeDisciplineSub === 2" class="sub-panel">
          <h4 class="sub-panel__title">学业警示与日常违纪</h4>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>异常类型</th>
                  <th>关联对象</th>
                  <th>发生次数</th>
                  <th>处理措施</th>
                  <th>扣分分值</th>
                  <th>记录时间</th>
                  <th>记录人</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in academicWarnings" :key="r.date">
                  <td>{{ r.type }}</td>
                  <td>{{ r.target }}</td>
                  <td>{{ r.count }}</td>
                  <td>{{ r.measure }}</td>
                  <td>{{ r.deduction }}</td>
                  <td>{{ r.date }}</td>
                  <td>{{ r.recorder }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 诚信档案 -->
        <div v-if="activeDisciplineSub === 3" class="sub-panel">
          <h4 class="sub-panel__title">诚信档案记录</h4>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>违约/失信类型</th>
                  <th>具体事由</th>
                  <th>发生金额/数量</th>
                  <th>处理状态</th>
                  <th>处理结果</th>
                  <th>记录时间</th>
                  <th>佐证材料</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in integrityRecords" :key="r.date">
                  <td>{{ r.type }}</td>
                  <td>{{ r.detail }}</td>
                  <td>{{ r.amount }}</td>
                  <td>{{ r.status }}</td>
                  <td>{{ r.result }}</td>
                  <td>{{ r.date }}</td>
                  <td><a class="evidence-link" href="#">{{ r.evidence }}</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.comprehensive-ledger {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 主 Tab */
.ledger-tabs {
  display: flex;
  gap: 8px;
}

.ledger-tab {
  padding: 8px 18px;
  border-radius: 5px;
  border: 1px solid rgba(0, 184, 255, 0.25);
  background: rgba(0, 38, 73, 0.35);
  color: #7eb4d8;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(0, 184, 255, 0.5);
    color: #8ef6ff;
  }

  &--active {
    background: rgba(0, 184, 255, 0.2);
    border-color: rgba(0, 184, 255, 0.55);
    color: #f6fbff;
    box-shadow: 0 0 14px rgba(0, 184, 255, 0.15);
  }
}

/* 子 Tab */
.sub-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sub-tab {
  padding: 5px 12px;
  border-radius: 4px;
  border: 1px solid rgba(0, 184, 255, 0.18);
  background: rgba(0, 38, 73, 0.3);
  color: #7eb4d8;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(0, 184, 255, 0.4);
    color: #8ef6ff;
  }

  &--active {
    background: rgba(0, 184, 255, 0.15);
    border-color: rgba(0, 184, 255, 0.45);
    color: #f6fbff;
  }
}

/* 荣誉成果网格 */
.honor-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* 子面板 */
.sub-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sub-panel__title {
  margin: 0;
  font-size: 16px;
  color: #b8ecff;
  font-weight: 700;
  letter-spacing: 0.04em;
}

/* 表格 */
.table-wrap {
  border-radius: 4px;
  border: 1px solid rgba(0, 184, 255, 0.12);
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.4;

  th,
  td {
    padding: 7px 10px;
    border: 1px solid rgba(0, 184, 255, 0.12);
    text-align: left;
    vertical-align: top;
    white-space: normal;
    word-break: break-all;
  }

  th {
    background: rgba(0, 38, 73, 0.55);
    color: #8edcff;
    font-weight: 700;
  }

  td {
    color: #d0e8f8;
  }

  tr:nth-child(even) td {
    background: rgba(0, 38, 73, 0.18);
  }

  tr:hover td {
    background: rgba(0, 184, 255, 0.08);
  }
}

.evidence-link {
  color: #55dfff;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    color: #8ef6ff;
  }
}

/* KPI（继承原有） */
.warn-section {
  padding: 10px 14px;
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
}

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
.ledger-tabs,
.tab-content {
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

/* Loading / Error */
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
    font-size: 15px;

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

@media (max-width: 1280px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
