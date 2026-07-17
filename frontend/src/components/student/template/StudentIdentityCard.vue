<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import StudentTplCard from './StudentTplCard.vue'
import StuHint from './StuHint.vue'
import StudentPeerRosterModal from './StudentPeerRosterModal.vue'
import { listClassPeers, listDormPeers, type StudentPeerItem } from '@/services/student/peers'
import type {
  AcademicDevVM,
  AttentionItemVM,
  CareerDevVM,
  HighlightItemVM,
  PersonalInfoVM,
} from '@/types/student/view'

const props = defineProps<{
  profile: PersonalInfoVM
  attention: AttentionItemVM[]
  careerDev: CareerDevVM
  academic?: AcademicDevVM
  highlights?: HighlightItemVM[]
  /** 班干部职务：班长 / 团支书 等，有则显示在姓名旁（取代原「在校」） */
  cadreRoles?: string[]
}>()

const emit = defineEmits<{ open: [id: string] }>()
const router = useRouter()
const avatarError = ref(false)

const peerOpen = ref(false)
const peerKind = ref<'class' | 'dorm' | null>(null)
const peerTitle = ref('')
const peerSubtitle = ref('')
const peers = ref<StudentPeerItem[]>([])
const peerLoading = ref(false)

type RiskLevel = 'low' | 'medium' | 'high'

const riskWeight: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 }
const riskText: Record<RiskLevel, string> = { low: '正常', medium: '需关注', high: '高危' }

function highestLevel(pattern: RegExp): RiskLevel {
  return props.attention
    .filter((item) => pattern.test(`${item.category}${item.label}`))
    .reduce<RiskLevel>((highest, item) => (
      riskWeight[item.level] > riskWeight[highest] ? item.level : highest
    ), 'low')
}

function detailFor(pattern: RegExp, fallback: string) {
  const hit = props.attention.find((item) => pattern.test(`${item.category}${item.label}`))
  return hit?.label || fallback
}

const warningCards = computed(() => {
  const psychological = props.profile.mentalLevelCode ?? highestLevel(/心理|健康|体测/)
  const academic = highestLevel(/学业|课程|挂科|GPA|补考/)
  const employment = highestLevel(/就业|实习|职业/)

  return [
    {
      label: '心理预警',
      level: psychological,
      conclusion: props.profile.mentalLevel || riskText[psychological],
      tip: `反映心理关注侧风险（绿=正常，黄=需关注，红=高危）。${detailFor(/心理|健康|体测/, '当前结论见下方文字')}`,
    },
    {
      label: '学业预警',
      level: academic,
      conclusion: riskText[academic],
      tip: `反映挂科、GPA 等学业风险（绿=正常，黄=需关注，红=高危）。${detailFor(/学业|课程|挂科|GPA|补考/, academic === 'low' ? '无挂科，仅需完成常规期末考核' : '请查看预警台账与补考安排')}`,
    },
    {
      label: '就业预警',
      level: employment,
      conclusion: riskText[employment],
      tip: `反映实习就业准备不足风险（绿=正常，黄=需关注，红=高危）。${detailFor(/就业|实习|职业/, employment === 'low' ? '就业填报待完善，暂无高危信号' : '关注实习与岗位匹配短板')}`,
    },
  ]
})

const avatarRisk = computed<RiskLevel>(() =>
  warningCards.value.reduce<RiskLevel>(
    (highest, item) => (riskWeight[item.level] > riskWeight[highest] ? item.level : highest),
    'low',
  ),
)

const growthTrendText = computed(() => ({
  positive: '正向上升',
  negative: '负向波动',
  stable: '总体平稳',
}[props.profile.growthTrend ?? 'stable']))

const sparkTitle = computed(() => {
  const values = props.academic?.gpaValues ?? []
  if (values.length >= 2) {
    const delta = values[values.length - 1] - values[values.length - 2]
    const dir = delta >= 0 ? '上升' : '下降'
    return `GPA 近学期${dir} ${Math.abs(delta).toFixed(2)}，趋势${growthTrendText.value}`
  }
  return `成长趋势：${growthTrendText.value}`
})

const recentDynamic = computed(() => {
  const fromProfile = props.profile.recentDynamics?.[0]
  if (fromProfile) return fromProfile
  const award = props.highlights?.[0]
  if (award) return { time: award.date || '近期', text: award.label, kind: 'award' as const }
  const warn = props.attention.find((a) => a.level !== 'low')
  if (warn) return { time: '预警', text: warn.label, kind: 'warn' as const }
  return { time: '动态', text: '暂无新增伴随式采集事件', kind: 'info' as const }
})

const managementItems = computed(() => [
  {
    label: '学籍状态',
    value: props.profile.onCampusStatus || '在校',
    tone: 'safe',
    tip: '当前在校学籍状态（在校/休学等）；休学退学等变更以教务系统为准。',
  },
  {
    label: '困难认定',
    value: props.profile.economicHardship ? '已认定' : '未认定',
    tone: props.profile.economicHardship ? 'warn' : 'safe',
    tip: '家庭经济困难认定结果，影响资助与帮扶策略。',
  },
  {
    label: '心理分级',
    value: props.profile.mentalLevel || '正常',
    tone: props.profile.mentalLevelCode === 'high' ? 'risk' : 'warn',
    tip: '心理工作关注等级；中高关注请辅导员跟进。',
  },
  {
    label: '成长趋势',
    value: growthTrendText.value,
    tone: props.profile.growthTrend === 'negative' ? 'risk' : 'safe',
    tip: sparkTitle.value,
  },
  {
    label: '征兵状态',
    value: props.careerDev.militaryNote || '无',
    tone: 'info',
    tip: '应征入伍或征兵备案相关状态；无特殊情况显示「无」。',
  },
])

const profileFieldTips: Record<string, string> = {
  学号: '学生唯一学籍编号，用于查档与跨系统对表。',
  班级: '行政班级；可点击查看同班同学名单。',
  专业: '当前就读专业名称。',
  年级: '入学年级或所在年级批次。',
  政治面貌: '党员/团员/群众等政治面貌信息。',
  宿舍: '住宿宿舍；可点击查看同宿舍同学。',
}

const highPotentialTags = computed(() => {
  const fromProfile = props.profile.highPotentialTags?.filter(Boolean) ?? []
  if (fromProfile.length) return fromProfile
  return props.attention
    .map((item) => item.label)
    .filter((label) => /高潜/.test(label))
})

const linkedTeachers = computed(() => [
  { label: '班主任', value: props.profile.mentor?.trim() || '—' },
  { label: '辅导员', value: props.profile.counselor?.trim() || '—' },
  { label: '毕设导师', value: props.profile.thesisAdvisor?.trim() || props.profile.mentor?.trim() || '—' },
])

const potentialMining = computed(() => {
  const gpa = props.academic?.gpa
  const majorRank = props.academic?.majorRank
  const majorTotal = props.academic?.majorTotal
  const awards = props.highlights?.length ?? 0
  return [
    {
      label: '尖子生成绩',
      value: gpa != null ? `GPA ${gpa.toFixed(2)}` : '—',
      tip: majorTotal
        ? `专业排名 ${majorRank}/${majorTotal}，用于识别学业尖子生。`
        : 'GPA 与专业排名用于识别学业尖子生。',
    },
    {
      label: '竞赛潜力',
      value: awards ? `${awards}项动态` : (highPotentialTags.value.some((t) => /竞赛/.test(t)) ? '竞赛高潜' : '待挖掘'),
      tip: '竞赛获奖与高潜标签，反映竞赛与创新实践潜力。',
    },
    {
      label: '科研潜力',
      value: highPotentialTags.value.some((t) => /科研/.test(t)) ? '科研高潜' : '待挖掘',
      tip: '大创/论文/专利等科研相关信号；接入科研系统后可细化。',
    },
  ]
})

const futureBenchmarks = computed(() => {
  const unis = props.careerDev.targetUniversities?.filter(Boolean) ?? []
  const cos = props.careerDev.targetCompanies?.filter(Boolean) ?? []
  return {
    universities: unis.length ? unis.slice(0, 3).join(' · ') : '待明确升学目标',
    companies: cos.length ? cos.slice(0, 3).join(' · ') : '待明确就业目标',
    destination: props.careerDev.employmentDestination || props.careerDev.employmentIntention || '待实习',
  }
})

/** 姓名旁职务标签：仅班干部显示，不再展示「在校」（学籍状态区已有） */
const cadreTitle = computed(() => {
  const roles = (props.cadreRoles ?? []).map((r) => r.trim()).filter(Boolean)
  if (roles.length) return roles[0]
  return props.profile.classCadreRole?.trim() || ''
})

const classClickable = computed(() => {
  const name = props.profile.className?.trim()
  return Boolean(name && name !== '—')
})

const dormClickable = computed(() => {
  const name = props.profile.dormitory?.trim()
  return Boolean(name && name !== '—')
})

async function openClassPeers() {
  if (!classClickable.value) return
  peerKind.value = 'class'
  peerTitle.value = props.profile.className
  peerSubtitle.value = `${props.profile.grade || ''} · ${props.profile.major || ''}`.trim()
  peerOpen.value = true
  peerLoading.value = true
  peers.value = []
  try {
    peers.value = await listClassPeers(props.profile.className, props.profile.studentId)
  } finally {
    peerLoading.value = false
  }
}

async function openDormPeers() {
  if (!dormClickable.value) return
  peerKind.value = 'dorm'
  peerTitle.value = props.profile.dormitory || '宿舍'
  peerSubtitle.value = `${props.profile.name}所在宿舍`
  peerOpen.value = true
  peerLoading.value = true
  peers.value = []
  try {
    peers.value = await listDormPeers(props.profile.dormitory || '', props.profile.studentId)
  } finally {
    peerLoading.value = false
  }
}

function closePeers() {
  peerOpen.value = false
}

function selectPeer(studentId: string) {
  if (!studentId || studentId === props.profile.studentId) return
  peerOpen.value = false
  router.push({ path: '/student', query: { studentId } })
}

function goSemesterSchedule() {
  router.push({ name: 'student-semester-schedule', query: { studentId: props.profile.studentId } })
}

function goBasicLedger() {
  router.push({ name: 'student-basic-ledger', query: { studentId: props.profile.studentId } })
}

function goWarningDetail(label: string) {
  const map: Record<string, string> = {
    '心理预警': 'student-psy-warning',
    '学业预警': 'student-academic-warning',
    '就业预警': 'student-employment-warning',
  }
  const name = map[label]
  if (name) {
    router.push({ name, query: { studentId: props.profile.studentId } })
  }
}
</script>

<template>
  <StudentTplCard
    icon="students"
    title="学生基础信息台账"
    tip="汇集学籍、帮扶与三类预警入口的基础档案，是辅导老师看学生的第一站。"
    class="stu-tpl__identity"
  >
    <div class="sid">
      <div class="sid__upper">
        <div class="sid__profile">
        <StuHint tip="照片边框颜色取三类预警中的最高等级：绿正常、黄需关注、红高危。" block class="sid__avatar-hint">
          <div class="sid__avatar" :class="`sid__avatar--${avatarRisk}`">
            <img
              v-if="profile.avatarUrl && !avatarError"
              :src="profile.avatarUrl"
              :alt="profile.name"
              @error="avatarError = true"
            >
            <span v-else>{{ profile.name.slice(0, 1) }}</span>
          </div>
        </StuHint>

        <div class="sid__identity">
          <div class="sid__name">
            <strong>{{ profile.name }}</strong>
            <em>{{ profile.gender || '男' }}</em>
            <StuHint v-if="cadreTitle" tip="班级干部职务，来自学工台账。">
              <span class="sid__tag sid__tag--cadre">{{ cadreTitle }}</span>
            </StuHint>
            <StuHint
              v-for="tag in highPotentialTags"
              :key="tag"
              tip="综合表现突出，建议重点培养与跟踪。"
            >
              <span class="sid__tag sid__tag--potential">{{ tag }}</span>
            </StuHint>
          </div>

          <dl class="sid__grid">
            <StuHint :tip="profileFieldTips['学号']" block>
              <div><dt>学号</dt><dd :title="profile.studentId">{{ profile.studentId }}</dd></div>
            </StuHint>
            <StuHint :tip="profileFieldTips['班级']" block>
              <div>
                <dt>班级</dt>
                <dd class="sid__grid-dd--wrap">
                  <button
                    v-if="classClickable"
                    type="button"
                    class="sid__link"
                    :title="`查看同班同学 · ${profile.className}`"
                    @click="openClassPeers"
                  >{{ profile.className }}</button>
                  <span v-else :title="profile.className">{{ profile.className || '—' }}</span>
                </dd>
              </div>
            </StuHint>
            <StuHint :tip="profileFieldTips['专业']" block>
              <div><dt>专业</dt><dd class="sid__grid-dd--wrap" :title="profile.major">{{ profile.major }}</dd></div>
            </StuHint>
            <StuHint :tip="profileFieldTips['年级']" block>
              <div><dt>年级</dt><dd :title="profile.grade">{{ profile.grade }}</dd></div>
            </StuHint>
            <StuHint :tip="profileFieldTips['政治面貌']" block>
              <div><dt>政治面貌</dt><dd class="sid__grid-dd--wrap" :title="profile.politicalStatus || '—'">{{ profile.politicalStatus || '—' }}</dd></div>
            </StuHint>
            <StuHint :tip="profileFieldTips['宿舍']" block>
              <div>
                <dt>宿舍</dt>
                <dd class="sid__grid-dd--wrap">
                  <button
                    v-if="dormClickable"
                    type="button"
                    class="sid__link"
                    :title="`查看同宿舍同学 · ${profile.dormitory}`"
                    @click="openDormPeers"
                  >{{ profile.dormitory }}</button>
                  <span v-else :title="profile.dormitory || '—'">{{ profile.dormitory || '—' }}</span>
                </dd>
              </div>
            </StuHint>
          </dl>
        </div>
        </div>

        <div class="sid__context">
          <section class="sid__teachers" aria-label="关联老师">
        <StuHint tip="班主任、辅导员与毕设导师，方便快速联络育人责任人。">
          <strong class="sid__section-label">关联老师</strong>
        </StuHint>
        <div class="sid__teachers-grid">
          <StuHint
            v-for="item in linkedTeachers"
            :key="item.label"
            block
            :tip="`${item.label}：${item.value}`"
          >
            <div class="sid__teacher-item">
              <span>{{ item.label }}</span>
              <em>{{ item.value }}</em>
            </div>
          </StuHint>
        </div>
          </section>

          <section class="sid__mining" aria-label="挖掘性数据">
        <StuHint tip="尖子生成绩、竞赛与科研潜力挖掘，用于重点培养识别。">
          <strong class="sid__section-label">潜力挖掘</strong>
        </StuHint>
        <div class="sid__mining-grid">
          <StuHint
            v-for="item in potentialMining"
            :key="item.label"
            block
            :tip="item.tip"
          >
            <div class="sid__mining-item">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </StuHint>
        </div>
          </section>

          <section class="sid__benchmark" aria-label="对标未来规划">
        <StuHint tip="对标升学高校与就业大厂（系统挖掘推荐，填报后可覆盖）。">
          <strong class="sid__section-label">对标规划 · {{ futureBenchmarks.destination }}</strong>
        </StuHint>
        <div class="sid__benchmark-lines">
          <p><em>升学高校</em><span>{{ futureBenchmarks.universities }}</span></p>
          <p><em>就业大厂</em><span>{{ futureBenchmarks.companies }}</span></p>
        </div>
          </section>
        </div>
      </div>

      <section class="sid__management" aria-label="管理与帮扶状态">
        <div class="sid__management-head">
          <StuHint tip="学工侧关键状态总览，用于快速判断帮扶优先级。">
            <strong>管理与帮扶状态</strong>
          </StuHint>
        </div>
        <div class="sid__management-grid">
          <StuHint
            v-for="item in managementItems"
            :key="item.label"
            block
            :tip="item.tip"
          >
            <article
              class="sid__management-item"
              :class="`sid__management-item--${item.tone}`"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </article>
          </StuHint>
        </div>
      </section>

      <div class="sid__utility-row">
        <StuHint tip="伴随式采集的最新事件（获奖、预警或信息变更）。" block>
          <div class="sid__recent" :class="`sid__recent--${recentDynamic.kind}`" :title="recentDynamic.text">
            <em>近期动态</em>
            <strong>{{ recentDynamic.time }} · {{ recentDynamic.text }}</strong>
          </div>
        </StuHint>

        <div class="sid__archive-actions">
          <StuHint tip="打开本学期课表详情。">
            <button type="button" @click="goSemesterSchedule">本学期课表 ›</button>
          </StuHint>
          <StuHint tip="打开更完整的学籍与基础档案。">
            <button type="button" class="sid__archive-btn" @click="goBasicLedger">基础信息台账 ›</button>
          </StuHint>
        </div>
      </div>

      <div class="sid__warnings" aria-label="学生预警状态">
        <StuHint
          v-for="item in warningCards"
          :key="item.label"
          block
          :tip="item.tip"
        >
          <button
            type="button"
            class="sid__warning"
            :class="`sid__warning--${item.level}`"
            @click="goWarningDetail(item.label)"
          >
            <span class="sid__warning-dot" aria-hidden="true" />
            <span class="sid__warning-main">
              <span class="sid__warning-label">{{ item.label }}</span>
              <small>{{ item.conclusion }}</small>
            </span>
          </button>
        </StuHint>
      </div>
    </div>

    <StudentPeerRosterModal
      :open="peerOpen"
      :kind="peerKind"
      :title="peerTitle"
      :subtitle="peerSubtitle"
      :peers="peers"
      :loading="peerLoading"
      @close="closePeers"
      @select="selectPeer"
    />
  </StudentTplCard>
</template>

<style scoped lang="scss">
.sid {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto auto auto;
  gap: 5px;
  overflow: hidden;
}

.sid__upper {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(250px, 0.8fr);
  gap: 8px;
  overflow: hidden;
}

.sid__context {
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 5px;
  overflow: hidden;
}

.sid__profile {
  min-height: 0;
  display: flex;
  gap: 10px;
  overflow: hidden;

  :deep(.sid__avatar-hint) {
    flex: 0 0 96px;
  }
}

.sid__section-label {
  display: block;
  margin-bottom: 4px;
  color: #9ed8f5;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.sid__teachers,
.sid__mining,
.sid__benchmark {
  flex: 0 0 auto;
  min-width: 0;
}

.sid__teachers-grid,
.sid__mining-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.sid__context .sid__section-label {
  margin-bottom: 2px;
  font-size: 11px;
}

.sid__context .sid__teachers-grid,
.sid__context .sid__mining-grid {
  gap: 4px;
}

.sid__context .sid__teacher-item,
.sid__context .sid__mining-item {
  padding: 4px 5px;
}

.sid__teacher-item,
.sid__mining-item {
  min-width: 0;
  padding: 5px 8px;
  border: 1px solid rgba(120, 200, 255, 0.16);
  border-radius: 3px;
  background: rgba(0, 36, 72, 0.4);

  span {
    display: block;
    color: #8eb8d8;
    font-size: 11px;
    font-weight: 600;
  }

  em,
  strong {
    display: block;
    margin-top: 2px;
    overflow: hidden;
    color: #e8f7ff;
    font-size: 13px;
    font-style: normal;
    font-weight: 700;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.sid__mining-item strong {
  color: #e8c878;
}

.sid__benchmark-lines {
  display: grid;
  gap: 3px;

  p {
    margin: 0;
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 8px;
    align-items: baseline;
    padding: 4px 8px;
    border: 1px solid rgba(232, 200, 120, 0.16);
    border-radius: 3px;
    background: rgba(40, 32, 12, 0.28);
  }

  em {
    color: #e8c878;
    font-size: 11px;
    font-style: normal;
    font-weight: 700;
  }

  span {
    overflow: hidden;
    color: #dceef8;
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.sid__avatar {
  flex: 0 0 96px;
  width: 96px;
  height: 96px;
  padding: 3px;
  border-radius: 50%;
  transition: background 0.25s ease, box-shadow 0.25s ease;

  &--low {
    background: conic-gradient(from 210deg, #7cf4ff, #2a7fd4 35%, #4ade80 70%, #7cf4ff);
    box-shadow: 0 0 0 1px rgba(74, 222, 128, 0.35), 0 0 28px rgba(40, 180, 120, 0.28);
  }

  &--medium {
    background: conic-gradient(from 210deg, #fde68a, #f59e0b 40%, #facc15 75%, #fde68a);
    box-shadow: 0 0 0 1px rgba(250, 204, 21, 0.45), 0 0 28px rgba(250, 180, 40, 0.32);
  }

  &--high {
    background: conic-gradient(from 210deg, #fda4af, #ef4444 40%, #f87171 75%, #fda4af);
    box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.5), 0 0 28px rgba(220, 60, 70, 0.35);
  }

  img,
  span {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    object-fit: cover;
    border-radius: 50%;
    border: 3px solid #031528;
    background: linear-gradient(160deg, #0c2d52, #071a34);
    color: #7ff6ff;
    font-size: 28px;
    font-weight: 800;
  }
}

.sid__identity {
  flex: 1;
  min-width: 0;
}

.sid__name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;

  strong {
    font-size: 24px;
    line-height: 1;
    color: #f7fbff;
    letter-spacing: 0.08em;
    text-shadow: 0 1px 3px rgba(0, 10, 28, 0.8);
  }

  em {
    padding: 4px 10px;
    border: 1px solid rgba(120, 210, 255, 0.28);
    border-radius: 2px;
    background: linear-gradient(135deg, rgba(0, 90, 160, 0.28), rgba(0, 40, 80, 0.35));
    color: #9ae4ff;
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
  }
}

.sid__tag {
  padding: 4px 10px;
  border: 1px solid;
  border-radius: 3px;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;

  &--cadre {
    border-color: rgba(232, 200, 120, 0.45);
    background: linear-gradient(135deg, rgba(140, 100, 20, 0.32), rgba(80, 55, 10, 0.35));
    color: #f0d78a;
    box-shadow: 0 0 10px rgba(232, 200, 120, 0.18);
  }

  &--potential {
    border-color: rgba(55, 233, 145, 0.55);
    background: linear-gradient(135deg, rgba(20, 140, 80, 0.28), rgba(8, 70, 42, 0.35));
    color: #4dffb0;
  }
}

.sid__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 3px;
  margin: 0;

  :deep(.stu-hint--block),
  div {
    min-width: 0;
    display: grid;
    grid-template-columns: 58px minmax(0, 1fr);
    align-items: center;
    font-size: 14px;
    line-height: 1.25;
  }

  :deep(.stu-hint--block > div) {
    display: contents;
  }

  dt {
    padding-top: 1px;
    color: #7eb4d8;
    font-size: 13px;
    font-weight: 600;
  }

  dd {
    margin: 0;
    color: #e8f4ff;
    font-size: 14px;
    font-weight: 500;
    word-break: break-all;
  }

  dd:not(.sid__grid-dd--wrap) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sid__grid-dd--wrap {
    overflow: visible;
    white-space: normal;
  }
}

.sid__link {
  display: inline;
  padding: 0;
  border: none;
  border-bottom: 1px dashed rgba(127, 246, 255, 0.55);
  background: transparent;
  color: #7ff6ff;
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  &:hover {
    color: #b8f7ff;
    border-bottom-color: rgba(184, 247, 255, 0.9);
  }
}

.sid__management {
  flex: 0 1 auto;
  min-height: 0;
  padding: 3px 7px;
  border: 1px solid rgba(120, 200, 255, 0.2);
  border-radius: 2px;
  background:
    linear-gradient(135deg, rgba(0, 80, 140, 0.2), transparent 55%),
    rgba(0, 28, 58, 0.42);
  overflow: hidden;
}

.sid__management-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 1px;

  strong { color: #a8e8ff; font-size: 13px; font-weight: 700; }
}

.sid__management-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 5px;

  :deep(.stu-hint--block) {
    min-width: 0;
    height: 100%;
  }

  :deep(.sid__management-item) {
    height: 100%;
  }
}

.sid__management-item {
  min-width: 0;
  padding: 3px 5px;
  border-left: 2px solid currentColor;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.56);

  span,
  strong {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span { color: #7eb4d8; font-size: 11px; font-weight: 600; }
  strong { margin-top: 1px; color: currentColor; font-size: 14px; font-weight: 700; }

  &--safe { color: #55e995; }
  &--warn { color: #facc15; }
  &--risk { color: #ff7474; }
  &--info { color: #65dfff; }
}

.sid__recent {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: center;
  padding: 3px 8px;
  border: 1px solid rgba(120, 200, 255, 0.2);
  border-radius: 2px;
  background: rgba(0, 40, 78, 0.4);

  em {
    padding: 2px 8px;
    border-radius: 2px;
    font-style: normal;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  strong {
    overflow: hidden;
    color: #e8f4ff;
    font-size: 14px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &--award {
    border-color: rgba(55, 233, 145, 0.28);
    em { background: rgba(55, 233, 145, 0.15); color: #67e8a3; }
  }

  &--warn {
    border-color: rgba(250, 204, 21, 0.3);
    em { background: rgba(250, 204, 21, 0.15); color: #facc15; }
  }

  &--info {
    em { background: rgba(45, 206, 255, 0.12); color: #65dfff; }
  }
}

.sid__utility-row {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 0.72fr);
  gap: 6px;

  > :deep(.stu-hint--block) {
    min-width: 0;
  }
}

.sid__archive-actions {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 8px;

  :deep(.stu-hint) {
    display: block;
    min-width: 0;
  }

  :deep(button),
  button {
    width: 100%;
    min-height: 30px;
    padding: 0 12px;
    border: 1px solid rgba(120, 210, 255, 0.28);
    border-radius: 2px;
    background: linear-gradient(180deg, rgba(0, 90, 160, 0.32), rgba(0, 50, 100, 0.28));
    color: #8ee9ff;
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
  }
}

.sid__archive-btn {
  border-color: rgba(0, 202, 255, 0.34) !important;
  background: rgba(0, 92, 168, 0.34) !important;
  color: #c8f4ff !important;
}

.sid__warnings {
  flex: 0 0 auto;
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;

  :deep(.stu-hint--block) {
    min-width: 0;
    height: 100%;
  }

  :deep(.sid__warning) {
    width: 100%;
    height: 100%;
  }
}

.sid__warning {
  min-width: 0;
  min-height: 44px;
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 5px 9px;
  border: 1px solid;
  border-radius: 2px;
  text-align: left;
  cursor: pointer;

  &--low {
    border-color: rgba(74, 222, 128, 0.32);
    background: rgba(38, 151, 92, 0.12);
    color: #55e995;
  }

  &--medium {
    border-color: rgba(250, 204, 21, 0.34);
    background: rgba(174, 121, 10, 0.14);
    color: #facc15;
  }

  &--high {
    border-color: rgba(248, 91, 91, 0.42);
    background: rgba(185, 43, 55, 0.16);
    color: #ff7474;
  }
}

.sid__warning-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}

.sid__warning-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sid__warning-label {
  overflow: hidden;
  color: #e8f4ff;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sid__warning-main small {
  overflow: hidden;
  color: currentColor;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
