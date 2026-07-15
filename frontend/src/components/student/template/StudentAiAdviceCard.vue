<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import StudentTplCard from './StudentTplCard.vue'
import StuHint from './StuHint.vue'
import type { AiAssistantVM, AiPortraitVM, EmploymentVM } from '@/types/student/view'

const props = defineProps<{
  assistant: AiAssistantVM
  portrait: AiPortraitVM
  employment: EmploymentVM
}>()

const emit = defineEmits<{ open: [id: string] }>()

type TabId = 'panorama' | 'risk' | 'coach' | 'chance' | 'path'

const tabs: Array<{ id: TabId; label: string; tip: string }> = [
  { id: 'panorama', label: '全景研判', tip: '一句话总评 + 岗位匹配与优劣势标签，先看整体画像。' },
  { id: 'risk', label: '风险雷达', tip: '需优先跟进的风险与预警事项。角标数字=待处理条数。' },
  { id: 'coach', label: '育人智策', tip: '辅导员本周/本月可执行的育人任务，可标记暂缓或完成。' },
  { id: 'chance', label: '机会雷达', tip: '竞赛、实习、活动等近期可把握的机会。' },
  { id: 'path', label: '成长路径', tip: '本学期→一年→毕业前的分阶段目标与行动清单。' },
]

const activeTab = ref<TabId>('panorama')
const AUTOPLAY_INTERVAL = 9000
let autoplayTimer: ReturnType<typeof setInterval> | null = null

const riskItems = computed(() =>
  props.portrait.pushes.filter((p) => p.type === 'warn' || /预警|风险|不足|挂科|学分/.test(p.text)),
)

const riskCount = computed(() => Math.max(riskItems.value.length, props.portrait.focusTags?.length ? 1 : 0))
const coachCount = computed(() => props.assistant.shortTermSuggestions.length + props.assistant.longTermSuggestions.length)
const chanceCount = computed(() => props.portrait.opportunities?.length || props.portrait.pushes.filter((p) => p.type === 'success' || p.type === 'info').length)

const tabBadges = computed<Record<TabId, number | null>>(() => ({
  panorama: null,
  risk: riskCount.value || null,
  coach: coachCount.value || null,
  chance: chanceCount.value || null,
  path: null,
}))

const strengthTags = computed(() =>
  props.portrait.strengthTags?.length
    ? props.portrait.strengthTags
    : props.portrait.portraitTags.filter((t) => /高潜|优势|稳定|正向/.test(t)).slice(0, 3).concat(
      props.portrait.portraitTags.filter((t) => !/高潜|优势|稳定|正向|待|不足/.test(t)).slice(0, 1),
    ).slice(0, 3),
)

const focusTags = computed(() =>
  props.portrait.focusTags?.length
    ? props.portrait.focusTags
    : props.portrait.portraitTags.filter((t) => /待|不足|短板|关注/.test(t)).concat(['实践经历不足']).slice(0, 3),
)

const jobMatches = computed(() => props.portrait.jobMatches.slice(0, 2))

const summaryText = computed(() => {
  const text = props.portrait.summary || ''
  return text.length > 96 ? `${text.slice(0, 96)}…` : text
})

const opportunities = computed(() => {
  if (props.portrait.opportunities?.length) return props.portrait.opportunities
  return props.portrait.pushes
    .filter((p) => p.type !== 'warn')
    .slice(0, 4)
    .map((p) => ({ time: p.time, text: p.text, action: '参考资料' }))
})

const pathNodes = computed(() => [
  {
    stage: '本学期',
    anchor: '专业项目 / 学科竞赛',
    items: props.assistant.shortTermSuggestions.slice(0, 3).concat(['完成职业能力测评']).slice(0, 4),
  },
  {
    stage: '未来一年',
    anchor: '企业实习 / 技能证书',
    items: ['完成1段专业对口实习', '获得1项专业技能证书', '建立项目作品集', '提升团队协作和表达能力'],
  },
  {
    stage: '毕业前',
    anchor: '就业/升学 / 毕业审核',
    items: [props.employment.developmentPath.long, '完善简历、作品集或升学材料', '达成就业或升学目标'].filter(Boolean),
  },
])

const coachTasks = ref([
  { key: 'week', title: '本周优先', badge: '待办', detail: '', status: 'todo' as 'todo' | 'hold' | 'done' },
  { key: 'month', title: '本月重点', badge: '跟进', detail: '', status: 'todo' as 'todo' | 'hold' | 'done' },
])

watch(
  () => [props.assistant.shortTermSuggestions[0], props.assistant.longTermSuggestions[0], props.portrait.coachingTasks],
  () => {
    const tasks = props.portrait.coachingTasks
    coachTasks.value = [
      {
        key: 'week',
        title: tasks?.[0]?.title || '本周优先：开展毕业学分核查',
        badge: tasks?.[0]?.priority || '待办',
        detail: tasks?.[0]?.detail || props.assistant.shortTermSuggestions[0] || '建议辅导员与学生核对培养方案',
        status: 'todo',
      },
      {
        key: 'month',
        title: tasks?.[1]?.title || '本月重点：补充专业实践成果',
        badge: tasks?.[1]?.priority || '跟进',
        detail: tasks?.[1]?.detail || props.assistant.longTermSuggestions[0] || '建议参加1项竞赛或创新项目',
        status: 'todo',
      },
    ]
  },
  { immediate: true },
)

function setCoachStatus(key: string, status: 'hold' | 'done') {
  const hit = coachTasks.value.find((t) => t.key === key)
  if (hit) hit.status = status
}

function stopAutoplay() {
  if (autoplayTimer) clearInterval(autoplayTimer)
  autoplayTimer = null
}

function startAutoplay() {
  stopAutoplay()
  autoplayTimer = setInterval(() => {
    const idx = tabs.findIndex((t) => t.id === activeTab.value)
    activeTab.value = tabs[(idx + 1) % tabs.length].id
  }, AUTOPLAY_INTERVAL)
}

function selectTab(id: TabId) {
  activeTab.value = id
  startAutoplay()
}

watch(
  () => riskCount.value,
  (n) => {
    if (n > 0 && activeTab.value === 'panorama') activeTab.value = 'risk'
  },
  { immediate: true },
)

onMounted(startAutoplay)
onBeforeUnmount(stopAutoplay)
</script>

<template>
  <StudentTplCard
    icon="innovation"
    title="智能育航"
    tip="AI 综合学业与画像，给出研判、风险、机会与成长建议，用于精准育人。"
    class="stu-tpl__ai"
  >
    <div class="navi" @mouseenter="stopAutoplay" @mouseleave="startAutoplay">
      <div class="navi__tabs" role="tablist" aria-label="智能育航功能">
        <StuHint v-for="tab in tabs" :key="tab.id" :tip="tab.tip">
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.id"
            :class="{ active: activeTab === tab.id }"
            @click="selectTab(tab.id)"
          >
            {{ tab.label }}
            <i
              v-if="tabBadges[tab.id]"
              :title="'该页待处理条数，不是评分'"
            >{{ tabBadges[tab.id] }}</i>
          </button>
        </StuHint>
      </div>

      <div class="navi__panel">
        <!-- 全景研判 -->
        <section v-if="activeTab === 'panorama'" class="navi-card">
          <StuHint tip="基于学业、素养与就业画像生成的综合研判摘要。" block>
            <p class="navi-card__summary" :title="portrait.summary">{{ summaryText }}</p>
          </StuHint>
          <div class="navi-jobs">
            <StuHint
              v-for="job in jobMatches"
              :key="job.role"
              block
              :tip="`岗位匹配度 ${job.match}%（越高越对口）。${[job.city, job.salary, job.requirements].filter(Boolean).join(' · ') || '点击可在详情页查看完整岗位要求。'}`"
            >
              <div class="navi-job">
                <div class="navi-job__head">
                  <strong>{{ job.role }}</strong>
                  <b>{{ job.match }}%</b>
                </div>
                <i><em :style="{ width: `${job.match}%` }" /></i>
              </div>
            </StuHint>
          </div>
          <div class="navi-tags">
            <div>
              <StuHint tip="相对突出的能力或表现标签。"><em>优势</em></StuHint>
              <span v-for="tag in strengthTags.slice(0, 3)" :key="tag" class="tag tag--good">{{ tag }}</span>
            </div>
            <div>
              <StuHint tip="短板或需补强的关注点。"><em>关注</em></StuHint>
              <span v-for="tag in focusTags.slice(0, 3)" :key="tag" class="tag tag--warn">{{ tag }}</span>
            </div>
          </div>
        </section>

        <!-- 风险雷达 -->
        <section v-else-if="activeTab === 'risk'" class="navi-card">
          <article v-for="(item, idx) in riskItems.slice(0, 2)" :key="idx" class="navi-risk">
            <header>
              <strong>{{ item.time }}</strong>
              <StuHint :tip="item.type === 'warn' ? '优先：建议尽快处理。' : '提醒：需关注，可择机跟进。'">
                <span>{{ item.type === 'warn' ? '优先' : '提醒' }}</span>
              </StuHint>
            </header>
            <p>{{ item.text }}</p>
          </article>
          <p v-if="!riskItems.length" class="navi-empty">当前无明显风险事项。</p>
        </section>

        <!-- 育人智策 -->
        <section v-else-if="activeTab === 'coach'" class="navi-card">
          <article v-for="task in coachTasks" :key="task.key" class="navi-task" :class="`is-${task.status}`">
            <header><strong>{{ task.title }}</strong><span>{{ task.status === 'done' ? '已完成' : task.status === 'hold' ? '已暂缓' : task.badge }}</span></header>
            <p>{{ task.detail }}</p>
            <div class="navi-task__actions">
              <StuHint tip="标记为暂缓跟进（当前仅前端暂存，未写入教务库）。">
                <button type="button" @click="setCoachStatus(task.key, 'hold')">暂缓</button>
              </StuHint>
              <StuHint tip="标记为已完成（当前仅前端暂存，未写入教务库）。">
                <button type="button" class="is-ok" @click="setCoachStatus(task.key, 'done')">完成</button>
              </StuHint>
            </div>
          </article>
        </section>

        <!-- 机会雷达 -->
        <section v-else-if="activeTab === 'chance'" class="navi-card">
          <div class="navi-timeline">
            <StuHint
              v-for="(item, idx) in opportunities.slice(0, 3)"
              :key="idx"
              block
              tip="近期可关注的竞赛、实习或活动机会。"
            >
              <div class="navi-timeline__item">
                <em>{{ item.time }}</em>
                <p>{{ item.text }}</p>
              </div>
            </StuHint>
          </div>
        </section>

        <!-- 成长路径 -->
        <section v-else class="navi-card">
          <div class="navi-path-track" aria-hidden="true">
            <div v-for="(node, idx) in pathNodes" :key="node.stage" class="navi-path-track__node" :class="{ active: idx === 0 }">
              <i />
              <strong>{{ node.stage }}</strong>
              <b v-if="idx < pathNodes.length - 1" />
            </div>
          </div>
          <div class="navi-path-cols">
            <StuHint
              v-for="node in pathNodes"
              :key="node.stage"
              block
              :tip="`${node.stage}阶段行动清单（${node.anchor}）。可点「完整方案」查看全文。`"
            >
              <div>
                <strong>{{ node.stage }}</strong>
                <ul>
                  <li v-for="item in node.items.slice(0, 2)" :key="item">{{ item }}</li>
                </ul>
              </div>
            </StuHint>
          </div>
          <StuHint tip="打开智能育航完整方案与更多建议。" block>
            <button type="button" class="navi-more" @click="emit('open', 'ai')">完整方案 ›</button>
          </StuHint>
        </section>
      </div>
    </div>
  </StudentTplCard>
</template>

<style scoped lang="scss">
/* 统一字阶：正文 16 / 辅文 15 / 标签 14，避免忽大忽小 */
.navi {
  --fs: 16px;
  --fs-sm: 15px;
  --fs-label: 14px;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 2px 6px 6px;
  font-size: var(--fs);
  line-height: 1.5;
  color: #d8eeff;
}

.navi__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  :deep(.stu-hint) {
    display: inline-flex;
  }

  button {
    padding: 7px 11px;
    border: 1px solid rgba(120, 200, 255, 0.22);
    border-radius: 4px;
    background: rgba(0, 40, 80, 0.35);
    color: #9ec9e6;
    font-size: var(--fs-sm);
    font-weight: 700;
    cursor: pointer;

    &.active {
      border-color: rgba(0, 220, 255, 0.55);
      background: rgba(0, 90, 150, 0.45);
      color: #e8f7ff;
    }

    i {
      margin-left: 4px;
      padding: 0 5px;
      border-radius: 8px;
      background: rgba(255, 120, 80, 0.25);
      color: #ffb4a0;
      font-style: normal;
      font-size: var(--fs-label);
    }
  }
}

.navi__panel {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.navi-card__summary {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  margin: 0 0 10px;
  overflow: hidden;
  color: #d8eeff;
  font-size: var(--fs);
  line-height: 1.55;
}

.navi-jobs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.navi-job {
  padding: 9px 11px;
  border: 1px solid rgba(0, 180, 255, 0.14);
  border-radius: 6px;
  background: rgba(0, 40, 78, 0.35);

  &__head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: var(--fs);

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

.navi-tags {
  display: grid;
  gap: 8px;

  em {
    display: block;
    margin-bottom: 4px;
    color: #8eb8d8;
    font-size: var(--fs-label);
    font-style: normal;
    font-weight: 700;
  }
}

.tag {
  display: inline-block;
  margin: 0 6px 4px 0;
  padding: 4px 9px;
  border-radius: 3px;
  font-size: var(--fs-label);
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

.navi-risk,
.navi-task {
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
    font-size: var(--fs);

    strong { color: #eaf6ff; }
    span { color: #f0b27a; font-size: var(--fs-label); font-weight: 700; }
  }

  p {
    margin: 0;
    color: #cfe6f8;
    font-size: var(--fs);
    line-height: 1.5;
  }
}

.navi-task__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;

  :deep(.stu-hint) {
    display: inline-flex;
  }

  :deep(button),
  button {
    padding: 5px 12px;
    border: 1px solid rgba(120, 200, 255, 0.25);
    border-radius: 4px;
    background: rgba(0, 50, 90, 0.4);
    color: #9ec9e6;
    font-size: var(--fs-label);
    cursor: pointer;

    &.is-ok {
      border-color: rgba(55, 233, 145, 0.35);
      color: #67e8a3;
    }
  }
}

.navi-task.is-done { opacity: 0.72; border-color: rgba(55, 233, 145, 0.35); }
.navi-task.is-hold { opacity: 0.78; border-color: rgba(250, 204, 21, 0.3); }

.navi-timeline__item {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 10px;
  margin-bottom: 8px;
  padding: 8px 10px;
  border-left: 2px solid rgba(30, 214, 255, 0.45);
  background: rgba(0, 40, 78, 0.3);
  font-size: var(--fs);

  em { color: #7ff6ff; font-style: normal; font-weight: 700; }
  p { margin: 0; color: #d8eeff; }
}

.navi-path-track {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;

  &__node {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1 1 200px;
    min-width: 0;

    i {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
      border: 2px solid rgba(100, 200, 255, 0.45);
      background: rgba(0, 40, 80, 0.8);
    }

    strong { color: #7ff6ff; font-size: var(--fs-sm); white-space: nowrap; }

    b {
      flex: 1;
      height: 2px;
      min-width: 12px;
      background: linear-gradient(90deg, rgba(100, 200, 255, 0.55), rgba(100, 200, 255, 0.12));
    }

    &:last-child b { display: none; }

    &.active i {
      border-color: #62dfff;
      background: #62dfff;
    }
  }
}

.navi-path-cols {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;

  strong {
    display: block;
    margin-bottom: 4px;
    color: #a8e8ff;
    font-size: var(--fs-sm);
  }

  ul {
    margin: 0;
    padding-left: 16px;
    color: #cfe6f8;
    font-size: var(--fs-label);
    line-height: 1.45;
  }
}

.navi-more {
  margin-top: 10px;
  width: 100%;
  padding: 9px;
  border: 1px solid rgba(120, 210, 255, 0.28);
  border-radius: 4px;
  background: rgba(0, 70, 120, 0.35);
  color: #8ee9ff;
  font-size: var(--fs-sm);
  font-weight: 700;
  cursor: pointer;
}

.navi-empty {
  margin: 16px 0;
  text-align: center;
  color: #7aa4c0;
  font-size: var(--fs);
}
</style>
