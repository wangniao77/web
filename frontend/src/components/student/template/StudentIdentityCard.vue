<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import StudentTplCard from './StudentTplCard.vue'
import StudentPeerRosterModal from './StudentPeerRosterModal.vue'
import { listClassPeers, listDormPeers, type StudentPeerItem } from '@/services/student/peers'
import type { AttentionItemVM, CareerDevVM, PersonalInfoVM } from '@/types/student/view'

const props = defineProps<{
  profile: PersonalInfoVM
  attention: AttentionItemVM[]
  careerDev: CareerDevVM
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
const riskText: Record<RiskLevel, string> = { low: '正常', medium: '需关注', high: '高风险' }

function highestLevel(pattern: RegExp): RiskLevel {
  return props.attention
    .filter((item) => pattern.test(`${item.category}${item.label}`))
    .reduce<RiskLevel>((highest, item) => (
      riskWeight[item.level] > riskWeight[highest] ? item.level : highest
    ), 'low')
}

const warningCards = computed(() => {
  const psychological = props.profile.mentalLevelCode ?? highestLevel(/心理|健康|体测/)
  const academic = highestLevel(/学业|课程|挂科|GPA|补考/)
  const employment = highestLevel(/就业|实习|职业/)

  return [
    { label: '心理预警', level: psychological, detail: props.profile.mentalLevel || riskText[psychological] },
    { label: '学业预警', level: academic, detail: riskText[academic] },
    { label: '就业预警', level: employment, detail: riskText[employment] },
  ]
})

const growthTrendText = computed(() => ({
  positive: '正向上升',
  negative: '负向波动',
  stable: '总体平稳',
}[props.profile.growthTrend ?? 'stable']))

const managementItems = computed(() => [
  { label: '在校状态', value: props.profile.onCampusStatus || '在校', tone: 'safe' },
  { label: '困难认定', value: props.profile.economicHardship ? '已认定' : '未认定', tone: props.profile.economicHardship ? 'warn' : 'safe' },
  { label: '心理分级', value: props.profile.mentalLevel || '正常', tone: props.profile.mentalLevelCode === 'high' ? 'risk' : 'warn' },
  { label: '成长趋势', value: growthTrendText.value, tone: props.profile.growthTrend === 'negative' ? 'risk' : 'safe' },
  { label: '征兵状态', value: props.careerDev.militaryNote || '无', tone: 'info' },
])

const highPotentialTags = computed(() => {
  const fromProfile = props.profile.highPotentialTags?.filter(Boolean) ?? []
  if (fromProfile.length) return fromProfile
  return props.attention
    .map((item) => item.label)
    .filter((label) => /高潜/.test(label))
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
</script>

<template>
  <StudentTplCard icon="students" title="学生基础档案" class="stu-tpl__identity">
    <div class="sid">
      <div class="sid__profile">
        <div class="sid__avatar">
          <img
            v-if="profile.avatarUrl && !avatarError"
            :src="profile.avatarUrl"
            :alt="profile.name"
            @error="avatarError = true"
          >
          <span v-else>{{ profile.name.slice(0, 1) }}</span>
        </div>

        <div class="sid__identity">
          <div class="sid__name">
            <strong>{{ profile.name }}</strong>
            <em>{{ profile.gender || '男' }}</em>
            <span class="sid__tag sid__tag--campus">{{ profile.onCampusStatus || '在校' }}</span>
            <span
              v-for="tag in highPotentialTags"
              :key="tag"
              class="sid__tag sid__tag--potential"
            >{{ tag }}</span>
          </div>

          <dl class="sid__grid">
            <div><dt>学号</dt><dd :title="profile.studentId">{{ profile.studentId }}</dd></div>
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
            <div><dt>专业</dt><dd class="sid__grid-dd--wrap" :title="profile.major">{{ profile.major }}</dd></div>
            <div><dt>年级</dt><dd :title="profile.grade">{{ profile.grade }}</dd></div>
            <div><dt>政治面貌</dt><dd class="sid__grid-dd--wrap" :title="profile.politicalStatus || '—'">{{ profile.politicalStatus || '—' }}</dd></div>
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
          </dl>
        </div>
      </div>

      <section class="sid__management" aria-label="管理与帮扶状态">
        <div class="sid__management-head">
          <strong>管理与帮扶状态</strong>
        </div>
        <div class="sid__management-grid">
          <article
            v-for="item in managementItems"
            :key="item.label"
            class="sid__management-item"
            :class="`sid__management-item--${item.tone}`"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </article>
        </div>
      </section>

      <div class="sid__archive-actions">
        <button type="button" @click="emit('open', 'timetable')">本学期课表 ›</button>
        <button type="button" class="sid__archive-btn" @click="emit('open', 'basic')">基础档案 ›</button>
      </div>

      <div class="sid__warnings" aria-label="学生预警状态">
        <button
          v-for="item in warningCards"
          :key="item.label"
          type="button"
          class="sid__warning"
          :class="`sid__warning--${item.level}`"
          @click="emit('open', 'warning')"
        >
          <span class="sid__warning-dot" aria-hidden="true" />
          <span class="sid__warning-label">{{ item.label }}</span>
          <strong>{{ item.detail }}</strong>
        </button>
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
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.sid__profile {
  flex: 0 0 auto;
  min-height: 0;
  display: flex;
  gap: 18px;
}

.sid__avatar {
  flex: 0 0 142px;
  width: 142px;
  height: 142px;
  padding: 3px;
  border-radius: 50%;
  background:
    conic-gradient(from 210deg, #7cf4ff, #2a7fd4 35%, #c9a86c 55%, #2a7fd4 75%, #7cf4ff);
  box-shadow:
    0 0 0 1px rgba(120, 210, 255, 0.2),
    0 0 28px rgba(0, 160, 220, 0.32),
    inset 0 0 12px rgba(0, 40, 80, 0.35);

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
    font-size: 34px;
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
  margin-bottom: 10px;

  strong {
    font-size: 32px;
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
    letter-spacing: 0.04em;
  }
}

.sid__tag {
  padding: 4px 10px;
  border: 1px solid;
  border-radius: 3px;
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;

  &--campus {
    border-color: rgba(74, 222, 128, 0.3);
    background: rgba(74, 222, 128, 0.08);
    color: #67e8a3;
  }

  &--potential {
    border-color: rgba(55, 233, 145, 0.55);
    background: linear-gradient(135deg, rgba(20, 140, 80, 0.28), rgba(8, 70, 42, 0.35));
    color: #4dffb0;
    box-shadow: 0 0 12px rgba(55, 233, 145, 0.28);
  }
}

.sid__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px 16px;
  margin: 0;

  div {
    min-width: 0;
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    align-items: start;
    font-size: 16px;
    line-height: 1.45;
  }

  dt {
    padding-top: 1px;
    color: #7eb4d8;
    font-size: 15px;
    font-weight: 600;
  }

  dd {
    margin: 0;
    color: #e8f4ff;
    font-size: 16px;
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
  transition: color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: #b8f7ff;
    border-bottom-color: rgba(184, 247, 255, 0.9);
  }
}

.sid__management {
  flex: 1;
  min-height: 96px;
  padding: 4px 8px;
  border: 1px solid rgba(120, 200, 255, 0.2);
  border-radius: 2px;
  background:
    linear-gradient(135deg, rgba(0, 80, 140, 0.2), transparent 55%),
    rgba(0, 28, 58, 0.42);
  box-shadow: inset 0 1px 0 rgba(160, 220, 255, 0.08);
}

.sid__management-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 3px;

  strong { color: #a8e8ff; font-size: 15px; font-weight: 700; }
  span { color: #7aa4c0; font-size: 12px; }
}

.sid__management-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 7px;
}

.sid__management-item {
  min-width: 0;
  padding: 5px 6px;
  border-left: 2px solid currentColor;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.56);

  span,
  strong,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span { color: #7eb4d8; font-size: 12px; font-weight: 600; }
  strong { margin-top: 3px; color: currentColor; font-size: 16px; font-weight: 700; }

  &--safe { color: #55e995; }
  &--warn { color: #facc15; }
  &--risk { color: #ff7474; }
  &--info { color: #65dfff; }
}

.sid__archive-actions {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 10px;

  button {
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid rgba(120, 210, 255, 0.28);
    border-radius: 2px;
    background: linear-gradient(180deg, rgba(0, 90, 160, 0.32), rgba(0, 50, 100, 0.28));
    color: #8ee9ff;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    box-shadow: inset 0 1px 0 rgba(180, 230, 255, 0.1);

    &:hover {
      border-color: rgba(140, 230, 255, 0.5);
      background: linear-gradient(180deg, rgba(0, 110, 190, 0.42), rgba(0, 70, 130, 0.36));
      box-shadow: 0 0 16px rgba(0, 160, 220, 0.2), inset 0 1px 0 rgba(200, 240, 255, 0.14);
    }
  }
}

.sid__archive-btn {
  border-color: rgba(0, 202, 255, 0.34) !important;
  background: rgba(0, 92, 168, 0.34) !important;
  color: #c8f4ff !important;
}

.sid__warnings {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.sid__warning {
  min-width: 0;
  min-height: 58px;
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid;
  border-radius: 2px;
  text-align: left;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);

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

  strong {
    color: currentColor;
    font-size: 15px;
    font-weight: 700;
    white-space: nowrap;
  }
}

.sid__warning-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}

.sid__warning-label {
  overflow: hidden;
  color: #e8f4ff;
  font-size: 15px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
