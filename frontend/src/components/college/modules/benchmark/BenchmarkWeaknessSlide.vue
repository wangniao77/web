<script setup lang="ts">
import { computed } from 'vue'
import type { BenchmarkPillarKey } from '@/types/college/api/benchmark-achievements'
import type { BenchmarkTriageVM } from '@/types/college/view/benchmark-achievements'

const props = defineProps<{
  triage: BenchmarkTriageVM
}>()

const emit = defineEmits<{
  open: [pillar: BenchmarkPillarKey]
}>()

const queue = computed(() => props.triage.rest.slice(0, 3))

function fill(value: number, target: number) {
  if (target <= 0) return '0%'
  return `${Math.min(100, Math.max(6, (value / target) * 100))}%`
}
</script>

<template>
  <div class="bm-seal">
    <ol class="bm-seal__queue">
      <li v-for="(item, index) in queue" :key="item.key">
        <button type="button" :aria-label="`查看${item.label}详情`" @click="emit('open', item.key)">
          <b>0{{ index + 2 }}</b>
          <span>
            <em>{{ item.label }}</em>
            <i>{{ item.metricLabel }} {{ item.value }}/{{ item.target }}{{ item.unit }}</i>
          </span>
          <strong>{{ item.status === 'empty' ? '不足' : `差${item.gap}` }}</strong>
        </button>
      </li>
    </ol>

    <button
      v-if="triage.worst"
      type="button"
      class="bm-seal__mark"
      :aria-label="`查看${triage.worst.label}详情`"
      @click="emit('open', triage.worst.key)"
    >
      <span>亟待补齐</span>
      <strong v-if="triage.worst.status !== 'empty'">
        {{ triage.worst.gap }}<small>{{ triage.worst.unit }}</small>
      </strong>
      <strong v-else class="is-empty">—</strong>
      <em>{{ triage.worst.label }} · {{ triage.worst.metricLabel }}</em>
      <i v-if="triage.worst.status !== 'empty'">
        <b :style="{ width: fill(triage.worst.value, triage.worst.target) }" />
      </i>
      <small v-if="triage.worst.status !== 'empty'">
        {{ triage.worst.value }} / {{ triage.worst.target }}{{ triage.worst.unit }}
      </small>
      <small v-else>数据不足</small>
    </button>
    <p v-else class="bm-seal__empty">{{ triage.headline }}</p>
  </div>
</template>

<style scoped lang="scss">
.bm-seal {
  --ink: #fff6e6;
  --mute: #d4c09a;
  --line: rgba(230, 194, 122, 0.22);
  --accent: #f0c56a;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 214px;
  gap: 10px;
  height: 100%;
  min-height: 0;
  padding: 2px 0 22px;
  overflow: hidden;
  isolation: isolate;

  &::before {
    content: '';
    position: absolute;
    inset: auto -16px -10px 36%;
    height: 78%;
    pointer-events: none;
    background: radial-gradient(ellipse at 100% 100%, rgba(230, 160, 60, 0.22), transparent 70%);
    z-index: 0;
  }
}

.bm-seal__queue,
.bm-seal__mark,
.bm-seal__empty {
  position: relative;
  z-index: 1;
}

.bm-seal__queue {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    flex: 1 1 0;
    min-height: 0;
  }

  button {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 100%;
    padding: 8px 12px;
    border: 1px solid rgba(230, 194, 122, 0.16);
    border-radius: 10px;
    background: rgba(48, 28, 8, 0.28);
    box-shadow: inset 0 1px 0 rgba(255, 220, 160, 0.06);
    text-align: left;
    color: inherit;
    cursor: pointer;
    transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), border-color 0.35s ease;

    b {
      color: var(--accent);
      font-family: 'Bahnschrift', 'DIN Alternate', ui-monospace, sans-serif;
      font-size: 16px;
      font-weight: 650;
      letter-spacing: 0.04em;
    }

    em {
      display: block;
      color: var(--ink);
      font-size: 17px;
      font-style: normal;
      font-weight: 800;
    }

    i {
      display: block;
      margin-top: 2px;
      color: var(--mute);
      font-size: 13px;
      font-style: normal;
      font-weight: 600;
    }

    strong {
      color: var(--accent);
      font-size: 20px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }

    &:hover {
      transform: translateX(-3px);
      border-color: rgba(240, 197, 106, 0.45);
    }

    &:active { transform: translateX(-1px); }
    &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  }
}

.bm-seal__mark {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 6px;
  min-width: 0;
  min-height: 0;
  padding: 16px 16px 14px;
  border: 1px solid rgba(240, 197, 106, 0.34);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 220, 160, 0.08), transparent 30%),
    linear-gradient(160deg, rgba(72, 40, 8, 0.55), rgba(24, 14, 4, 0.62));
  box-shadow:
    inset 0 1px 0 rgba(255, 230, 180, 0.16),
    0 16px 32px rgba(20, 10, 0, 0.28);
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), border-color 0.35s ease;

  span {
    color: var(--mute);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.32em;
  }

  strong {
    color: var(--accent);
    font-family: 'Bahnschrift', 'DIN Alternate', ui-monospace, sans-serif;
    font-size: 64px;
    font-weight: 650;
    line-height: 0.84;
    letter-spacing: -0.05em;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 28px rgba(240, 197, 106, 0.28);

    small {
      margin-left: 5px;
      color: var(--mute);
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0;
      text-shadow: none;
    }

    &.is-empty { color: rgba(212, 192, 154, 0.4); }
  }

  em {
    color: var(--ink);
    font-size: 18px;
    font-style: normal;
    font-weight: 800;
  }

  i {
    display: block;
    height: 6px;
    margin-top: 4px;
    border-radius: 99px;
    background: rgba(240, 197, 106, 0.14);
    overflow: hidden;

    b {
      display: block;
      height: 100%;
      background: var(--accent);
    }
  }

  > small {
    color: var(--mute);
    font-size: 13px;
    font-weight: 600;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(240, 197, 106, 0.55);
  }

  &:active { transform: translateY(0); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
}

.bm-seal__empty {
  grid-column: 1 / -1;
  margin: auto 0;
  color: var(--mute);
  font-size: 18px;
}
</style>
