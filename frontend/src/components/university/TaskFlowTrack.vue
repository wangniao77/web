<script setup lang="ts">
import { computed } from 'vue'
import type { KeyTaskVM } from '@/types/university/view'
import type { RiskLevel } from '@/constants/university/risk'

const props = withDefaults(
  defineProps<{ tasks: KeyTaskVM[]; limit?: number }>(),
  { limit: 5 },
)

const COLORS: Record<RiskLevel, string> = {
  normal: '#37e0a4',
  ongoing: '#4b8dff',
  attention: '#ffb057',
  warning: '#ff6b78',
}

const lanes = computed(() =>
  props.tasks.slice(0, props.limit).map((t) => ({
    ...t,
    color: COLORS[t.riskLevel],
    nodes: [0, 34, 68, 100],
  })),
)
</script>

<template>
  <ul class="flow">
    <li
      v-for="task in lanes"
      :key="task.id"
      class="flow__lane"
      :style="{ '--lane-color': task.color }"
    >
      <div class="flow__head">
        <h4>{{ task.name }}</h4>
        <span>计划节点 {{ task.plannedNode }}</span>
      </div>

      <div class="flow__track">
        <span class="flow__rail" />
        <span class="flow__energy" :style="{ width: `${task.progress}%` }" />
        <span
          v-for="n in task.nodes"
          :key="n"
          class="flow__node"
          :class="{ 'is-lit': n <= task.progress }"
          :style="{ left: `${n}%` }"
        />
        <span class="flow__pulse" :style="{ left: `${Math.min(task.progress, 100)}%` }" />
      </div>

      <div class="flow__meta">
        <strong>{{ task.progress }}<i>%</i></strong>
        <span class="flow__status">{{ task.riskLabel }}</span>
      </div>
    </li>
  </ul>
</template>

<style scoped lang="scss">
.flow {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  height: 100%;
}

.flow__lane {
  display: grid;
  grid-template-columns: 1.4fr 2.6fr auto;
  align-items: center;
  gap: 16px;
  padding: 5px 4px;
}

.flow__head {
  min-width: 0;

  h4 {
    font-size: var(--uni-fs-body);
    font-weight: 600;
    color: var(--uni-text-primary);
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    font-size: 12px;
    color: var(--uni-text-muted);
  }
}

.flow__track {
  position: relative;
  height: 22px;
  display: flex;
  align-items: center;
}

.flow__rail {
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 4px;
  background: rgba(90, 170, 255, 0.14);
}

.flow__energy {
  position: absolute;
  left: 0;
  height: 4px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(90, 170, 255, 0.2), var(--lane-color));
  box-shadow: 0 0 10px var(--lane-color);
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.flow__node {
  position: absolute;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  border-radius: 50%;
  background: rgba(20, 40, 70, 0.9);
  border: 1.5px solid rgba(90, 170, 255, 0.35);

  &.is-lit {
    background: var(--lane-color);
    border-color: var(--lane-color);
    box-shadow: 0 0 8px var(--lane-color);
  }
}

.flow__pulse {
  position: absolute;
  width: 12px;
  height: 12px;
  margin-left: -6px;
  border-radius: 50%;
  background: var(--lane-color);
  box-shadow: 0 0 12px var(--lane-color);
  animation: flow-breath 2.4s ease-in-out infinite;
}

.flow__meta {
  text-align: right;
  min-width: 62px;

  strong {
    display: block;
    font-family: var(--uni-font-number);
    font-size: 27px;
    font-weight: 700;
    line-height: 1;
    color: var(--lane-color);
    text-shadow: 0 0 12px color-mix(in srgb, var(--lane-color) 45%, transparent);

    i { font-style: normal; font-size: 0.48em; margin-left: 1px; color: var(--uni-text-secondary); }
  }

  .flow__status {
    font-size: 13px;
    color: var(--lane-color);
  }
}

@keyframes flow-breath {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.35); opacity: 0.7; }
}
</style>
