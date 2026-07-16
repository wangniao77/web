<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import DashIcon, { type IconKind } from '@/components/college/DashIcon.vue'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import {
  mockKeyPlanProgress,
  type PlanProgressStatus,
} from '@/mock/college/key-plan-progress'

const data = mockKeyPlanProgress
const viewportRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)

const summary = computed(() => {
  const { total, completed, ongoing, attention } = data.overview
  return {
    total,
    completed,
    ongoing,
    attention,
    completedPct: total ? Math.round((completed / total) * 100) : 0,
    ongoingPct: total ? Math.round((ongoing / total) * 100) : 0,
    attentionPct: total ? Math.round((attention / total) * 100) : 0,
  }
})

const loopItems = computed(() => [...data.metrics, ...data.metrics])

function statusKey(status: PlanProgressStatus) {
  if (status === 'completed') return 'completed'
  if (status === 'attention') return 'attention'
  return 'in-progress'
}

function statusLabel(status: PlanProgressStatus) {
  if (status === 'completed') return '已完成'
  if (status === 'attention') return '需关注'
  return '推进中'
}

const iconMap: Record<string, IconKind> = {
  国家两金项目: 'research',
  教育部项目: 'academic',
  省级项目: 'innovation',
  C类以上学术论文: 'research',
  横向项目到账经费: 'funding',
  决策咨询报告: 'contract',
  知识产权: 'award',
  教学成果奖: 'trophy',
  省级教研教改项目: 'course',
  教学竞赛: 'trophy',
  教研论文: 'academic',
}

function iconFor(name: string, category: 'research' | 'teaching'): IconKind {
  return iconMap[name] ?? (category === 'teaching' ? 'academic' : 'task')
}

function openDetail() {
  openCollegeDetail({ kind: 'key-tasks' })
}

const SPEED = 55
let loopDistance = 0
let lastTs = 0
let running = false
let resizeObserver: ResizeObserver | null = null
let channel: MessageChannel | null = null

function measureLoop() {
  const track = trackRef.value
  if (!track) {
    loopDistance = 0
    return
  }
  loopDistance = Math.floor(track.scrollHeight / 2)
}

function step() {
  const viewport = viewportRef.value
  if (!viewport || !running) return

  const now = performance.now()
  if (!lastTs) lastTs = now
  const dt = Math.min(1, Math.max(0, (now - lastTs) / 1000))
  lastTs = now

  if (loopDistance < 8) measureLoop()
  if (loopDistance < 8) return

  let next = viewport.scrollTop + SPEED * dt
  if (next >= loopDistance) next -= loopDistance
  viewport.scrollTop = next
}

function pump() {
  if (!running || !channel) return
  step()
  // MessageChannel 在部分环境下比 setInterval 更不易被彻底冻住
  try {
    channel.port2.postMessage(null)
  } catch {
    window.setTimeout(pump, 50)
  }
}

onMounted(async () => {
  await nextTick()
  measureLoop()
  lastTs = performance.now()
  if (viewportRef.value) viewportRef.value.scrollTop = 0

  running = true
  channel = new MessageChannel()
  channel.port1.onmessage = () => {
    // 轻微速率，约 20fps，足够平滑
    window.setTimeout(pump, 50)
  }
  pump()
  window.setTimeout(measureLoop, 200)

  resizeObserver = new ResizeObserver(() => {
    const vp = viewportRef.value
    const prev = vp?.scrollTop ?? 0
    measureLoop()
    if (vp && loopDistance > 0) {
      vp.scrollTop = prev % loopDistance
    }
  })
  if (trackRef.value) resizeObserver.observe(trackRef.value)
  if (viewportRef.value) resizeObserver.observe(viewportRef.value)
})

onBeforeUnmount(() => {
  running = false
  if (channel) {
    channel.port1.onmessage = null
    channel.port1.close()
    channel.port2.close()
    channel = null
  }
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <div class="key-plan-scroll">
    <div ref="viewportRef" class="key-plan-scroll__viewport">
      <ul ref="trackRef" class="key-plan-scroll__track">
        <li
          v-for="(item, index) in loopItems"
          :key="`${item.id}-${index}`"
          class="key-plan-scroll__row"
          :class="`is-${statusKey(item.status)}`"
          @click="openDetail"
        >
          <span class="key-plan-scroll__icon">
            <DashIcon :kind="iconFor(item.name, item.category)" :size="16" />
          </span>
          <span class="key-plan-scroll__name">{{ item.name }}</span>
          <div class="key-plan-scroll__bar">
            <i :style="{ width: `${item.progress}%` }" />
          </div>
          <span class="key-plan-scroll__tag">{{ statusLabel(item.status) }}</span>
        </li>
      </ul>
    </div>

    <div class="key-plan-scroll__summary">
      <div class="key-plan-scroll__summary-item">
        <span>重点任务总数</span>
        <strong>{{ summary.total }}<small>项</small></strong>
      </div>
      <div class="key-plan-scroll__summary-item is-done">
        <span>已完成</span>
        <strong>{{ summary.completed }}<small>项</small> {{ summary.completedPct }}%</strong>
      </div>
      <div class="key-plan-scroll__summary-item is-run">
        <span>推进中</span>
        <strong>{{ summary.ongoing }}<small>项</small> {{ summary.ongoingPct }}%</strong>
      </div>
      <div class="key-plan-scroll__summary-item is-warn">
        <span>需关注</span>
        <strong>{{ summary.attention }}<small>项</small> {{ summary.attentionPct }}%</strong>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.key-plan-scroll {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.key-plan-scroll__viewport {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  /* 用 scrollTop 驱动；隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
}

.key-plan-scroll__track {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.key-plan-scroll__row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1.05fr) minmax(72px, 1.15fr) auto;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  min-width: 0;
  padding: 8px 10px 8px 6px;
  border-radius: 6px;
  background: rgba(0, 50, 100, 0.12);
  cursor: pointer;

  &:hover {
    background: rgba(0, 130, 230, 0.12);
  }
}

.key-plan-scroll__icon {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 100, 180, 0.22);
  border: 1px solid rgba(0, 242, 255, 0.2);

  :deep(svg) {
    width: 16px;
    height: 16px;
    color: #55dfff;
  }
}

.key-plan-scroll__name {
  min-width: 0;
  overflow: hidden;
  color: #eef9ff;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.key-plan-scroll__bar {
  position: relative;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(7, 55, 128, 0.65);

  i {
    position: absolute;
    inset: 0 auto 0 0;
    display: block;
    height: 100%;
    border-radius: inherit;
  }
}

.key-plan-scroll__row.is-in-progress .key-plan-scroll__bar i {
  background: linear-gradient(90deg, #0d71ff, #00f2ff, #63ffe1);
}

.key-plan-scroll__row.is-completed .key-plan-scroll__bar i {
  background: linear-gradient(90deg, #1db87a, #2ee6a8, #7dffc8);
}

.key-plan-scroll__row.is-attention .key-plan-scroll__bar i {
  background: linear-gradient(90deg, #ff6b4a, #ff9f43, #ffc46b);
}

.key-plan-scroll__tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.key-plan-scroll__row.is-in-progress .key-plan-scroll__tag {
  color: #8ef6ff;
  background: rgba(0, 120, 220, 0.28);
  border: 1px solid rgba(0, 200, 255, 0.35);
}

.key-plan-scroll__row.is-completed .key-plan-scroll__tag {
  color: #9dffd4;
  background: rgba(30, 180, 120, 0.25);
  border: 1px solid rgba(46, 230, 168, 0.4);
}

.key-plan-scroll__row.is-attention .key-plan-scroll__tag {
  color: #ffd0b8;
  background: rgba(200, 80, 40, 0.28);
  border: 1px solid rgba(255, 140, 80, 0.45);
}

.key-plan-scroll__summary {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  padding: 6px 4px;
  border-radius: 6px;
  border: 1px solid rgba(0, 242, 255, 0.16);
  background: rgba(0, 60, 120, 0.18);
}

.key-plan-scroll__summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 0 2px;
  border-right: 1px solid rgba(0, 200, 255, 0.12);

  &:last-child {
    border-right: none;
  }

  span {
    color: #8ec8e8;
    font-size: clamp(14px, 0.95vw, 18px);
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  strong {
    color: #e8fbff;
    font-size: clamp(18px, 1.2vw, 22px);
    font-weight: 800;
    line-height: 1.15;
    white-space: nowrap;

    small {
      margin: 0 2px;
      color: #7fdfff;
      font-size: 0.55em;
      font-weight: 600;
    }
  }

  &.is-done strong {
    color: #6effc2;
  }

  &.is-run strong {
    color: #66d9ff;
  }

  &.is-warn strong {
    color: #ffb27a;
  }
}
</style>
