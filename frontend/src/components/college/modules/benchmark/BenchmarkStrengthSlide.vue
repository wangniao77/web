<script setup lang="ts">
import type { BenchmarkPillarKey } from '@/types/college/api/benchmark-achievements'
import type { BenchmarkShowcaseVM } from '@/types/college/view/benchmark-achievements'

defineProps<{
  showcase: BenchmarkShowcaseVM
}>()

const emit = defineEmits<{
  open: [pillar: BenchmarkPillarKey]
}>()

function pad(index: number) {
  return String(index + 1).padStart(2, '0')
}
</script>

<template>
  <div class="bm-honor">
    <button
      v-if="showcase.star"
      type="button"
      class="bm-honor__star"
      :aria-label="`查看${showcase.star.label}详情`"
      @click="emit('open', showcase.star.key)"
    >
      <span class="bm-honor__kicker">高光</span>
      <strong>
        {{ showcase.star.value }}<small>{{ showcase.star.unit }}</small>
      </strong>
      <em>{{ showcase.star.metricLabel }}</em>
      <i>{{ showcase.star.label }}</i>
      <ul v-if="showcase.medals.length">
        <li v-for="item in showcase.medals" :key="item.key">
          {{ item.value }}{{ item.unit }} {{ item.metricLabel }}
        </li>
      </ul>
    </button>
    <p v-else class="bm-honor__empty">{{ showcase.headline }}</p>

    <div class="bm-honor__wall">
      <button
        v-for="(item, index) in showcase.highlights"
        :key="item.id"
        type="button"
        class="bm-honor__piece"
        :aria-label="`查看${item.pillarLabel}详情`"
        @click="emit('open', item.pillar)"
      >
        <b>{{ pad(index) }}</b>
        <span>
          <em>{{ item.pillarLabel }}</em>
          <strong>{{ item.title }}</strong>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bm-honor {
  --ink: #f2f8ff;
  --mute: #9ec8e0;
  --line: rgba(170, 220, 240, 0.2);
  --accent: #8ce7f6;
  position: relative;
  display: grid;
  grid-template-columns: 196px minmax(0, 1fr);
  gap: 10px;
  height: 100%;
  min-height: 0;
  padding: 2px 0 22px;
  overflow: hidden;
  isolation: isolate;

  &::before {
    content: '';
    position: absolute;
    inset: -8px 40% auto -12px;
    height: 70%;
    pointer-events: none;
    background: radial-gradient(ellipse at 0 0, rgba(80, 210, 235, 0.28), transparent 68%);
    z-index: 0;
  }
}

.bm-honor__star,
.bm-honor__wall,
.bm-honor__empty {
  position: relative;
  z-index: 1;
}

.bm-honor__star {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 4px;
  min-width: 0;
  min-height: 0;
  padding: 14px 14px 12px;
  border: 1px solid rgba(140, 231, 246, 0.28);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 32%),
    linear-gradient(160deg, rgba(0, 70, 120, 0.45), rgba(2, 18, 48, 0.55));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 16px 32px rgba(0, 16, 40, 0.28);
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), border-color 0.35s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(140, 231, 246, 0.5);
  }

  &:active { transform: translateY(0); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
}

.bm-honor__kicker {
  color: var(--mute);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.32em;
}

.bm-honor__star strong {
  color: var(--accent);
  font-family: 'Bahnschrift', 'DIN Alternate', ui-monospace, sans-serif;
  font-size: 64px;
  font-weight: 650;
  line-height: 0.84;
  letter-spacing: -0.05em;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 28px rgba(140, 231, 246, 0.28);

  small {
    margin-left: 5px;
    color: var(--mute);
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0;
    text-shadow: none;
  }
}

.bm-honor__star em {
  color: var(--ink);
  font-size: 20px;
  font-style: normal;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.bm-honor__star > i {
  color: var(--mute);
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
}

.bm-honor__star ul {
  margin: 8px 0 0;
  padding: 8px 0 0;
  list-style: none;
  border-top: 1px solid var(--line);

  li {
    color: var(--mute);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;
  }
}

.bm-honor__empty {
  grid-column: 1 / -1;
  margin: auto 0;
  color: var(--mute);
  font-size: 18px;
}

.bm-honor__wall {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.bm-honor__piece {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  flex: 1 1 0;
  min-height: 0;
  padding: 8px 12px;
  border: 1px solid rgba(160, 214, 236, 0.14);
  border-radius: 10px;
  background: rgba(0, 32, 68, 0.28);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), border-color 0.35s ease;

  b {
    color: var(--accent);
    font-family: 'Bahnschrift', 'DIN Alternate', ui-monospace, sans-serif;
    font-size: 18px;
    font-weight: 650;
    letter-spacing: 0.06em;
  }

  em {
    display: block;
    color: var(--mute);
    font-size: 13px;
    font-style: normal;
    font-weight: 700;
    letter-spacing: 0.12em;
  }

  strong {
    display: block;
    margin-top: 2px;
    color: var(--ink);
    font-size: 16px;
    font-weight: 700;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &:hover {
    transform: translateX(3px);
    border-color: rgba(140, 231, 246, 0.4);
  }

  &:active { transform: translateX(1px); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
}
</style>
