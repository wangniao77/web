<script setup lang="ts">
import { computed, reactive } from 'vue'
import DashIcon, { type IconKind } from '@/components/college/DashIcon.vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'
import {
  groupSummary,
  mockKeyPlanProgress,
  type KeyPlanGroup,
  type PlanGroupCategory,
  type PlanProgressStatus,
} from '@/mock/college/key-plan-progress'

const router = useRouter()
const data = mockKeyPlanProgress

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

const expanded = reactive<Record<string, boolean>>(
  Object.fromEntries(data.groups.map((g) => [g.id, g.defaultExpanded !== false])),
)

function toggleGroup(id: string) {
  expanded[id] = !expanded[id]
}

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
  博士点申报与获批: 'academic',
  硕士点建设阶段性工作: 'research',
  高层次人才引育: 'faculty',
  青年教师成长: 'students',
  教学科研团队建设: 'innovation',
  教师能力体系提升: 'course',
  职称晋升与发展支撑: 'award',
  '双师型（企业）师资建设': 'briefcase',
  师资考核与激励机制优化: 'evaluation',
}

function iconFor(name: string, category: PlanGroupCategory): IconKind {
  return iconMap[name] ?? (category === 'faculty' ? 'faculty' : 'academic')
}

function groupIcon(category: PlanGroupCategory): IconKind {
  return category === 'faculty' ? 'faculty' : 'academic'
}

function openDetail() {
  router.push(ROUTES.college.keyTasks)
}

function onGroupHeaderClick(group: KeyPlanGroup, event: MouseEvent) {
  event.stopPropagation()
  toggleGroup(group.id)
}
</script>

<template>
  <div class="key-plan-scroll">
    <div class="key-plan-scroll__viewport">
      <div class="key-plan-groups">
        <section
          v-for="group in data.groups"
          :key="group.id"
          class="key-plan-group"
          :class="{ 'is-collapsed': !expanded[group.id] }"
        >
          <button
            type="button"
            class="key-plan-group__head"
            :aria-expanded="expanded[group.id]"
            @click="onGroupHeaderClick(group, $event)"
          >
            <span class="key-plan-group__icon">
              <DashIcon :kind="groupIcon(group.id)" :size="16" />
            </span>
            <span class="key-plan-group__titles">
              <strong>{{ group.title }}</strong>
              <em>{{ group.subtitle }}</em>
            </span>
            <span class="key-plan-group__meta">
              <b>{{ groupSummary(group).avgProgress }}%</b>
              <small>{{ groupSummary(group).total }}项</small>
            </span>
            <span class="key-plan-group__chevron" aria-hidden="true" />
          </button>

          <ul v-show="expanded[group.id]" class="key-plan-group__list">
            <li
              v-for="item in group.metrics"
              :key="item.id"
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
        </section>
      </div>
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
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 200, 255, 0.35) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(0, 200, 255, 0.35);
  }
}

.key-plan-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.key-plan-group {
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.18);
  background: rgba(0, 40, 90, 0.28);
  overflow: hidden;
}

.key-plan-group__head {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto 16px;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 8px 10px;
  border: 0;
  background: linear-gradient(90deg, rgba(0, 100, 180, 0.28), rgba(0, 60, 120, 0.12));
  cursor: pointer;
  text-align: left;
  color: inherit;

  &:hover {
    background: linear-gradient(90deg, rgba(0, 130, 220, 0.36), rgba(0, 80, 150, 0.16));
  }
}

.key-plan-group__icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 140, 220, 0.28);
  border: 1px solid rgba(0, 242, 255, 0.28);

  :deep(svg) {
    width: 15px;
    height: 15px;
    color: #7ce9ff;
  }
}

.key-plan-group__titles {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;

  strong {
    color: #f2fbff;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  em {
    color: #8ec8e8;
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.key-plan-group__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
  line-height: 1.15;

  b {
    color: #66d9ff;
    font-size: 18px;
    font-weight: 800;
  }

  small {
    color: #8ec8e8;
    font-size: 12px;
    font-weight: 600;
  }
}

.key-plan-group__chevron {
  width: 8px;
  height: 8px;
  border-right: 2px solid #8ef6ff;
  border-bottom: 2px solid #8ef6ff;
  transform: rotate(45deg);
  transition: transform 0.2s ease;
  justify-self: center;
}

.key-plan-group.is-collapsed .key-plan-group__chevron {
  transform: rotate(-45deg);
  margin-top: 2px;
}

.key-plan-group__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 6px 8px 8px;
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
  font-size: 20px;
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
  font-size: 18px;
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
