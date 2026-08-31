<script setup lang="ts">
import type { BenchmarkPillarKey } from '@/types/college/api/benchmark-achievements'
import type {
  BenchmarkDataCardVM,
  BenchmarkHeroKpiVM,
} from '@/types/college/view/benchmark-achievements'

defineProps<{
  heroes: BenchmarkHeroKpiVM[]
  cards: BenchmarkDataCardVM[]
}>()

const emit = defineEmits<{
  open: [pillar: BenchmarkPillarKey]
}>()
</script>

<template>
  <div class="bm-folio">
    <header class="bm-folio__mast">
      <p v-for="hero in heroes" :key="hero.key" class="bm-folio__hero">
        <strong>
          {{ hero.value }}<small>{{ hero.unit }}</small>
        </strong>
        <span>{{ hero.label }}</span>
      </p>
    </header>

    <div class="bm-folio__index" role="list">
      <button
        v-for="card in cards"
        :key="card.key"
        type="button"
        class="bm-folio__key"
        role="listitem"
        :aria-label="`查看${card.label}详情`"
        @click="emit('open', card.key)"
      >
        <em>{{ card.shortLabel }}</em>
        <template v-if="card.metrics[0]">
          <b>
            {{ card.metrics[0].value }}<small v-if="card.metrics[0].unit">{{ card.metrics[0].unit }}</small>
          </b>
          <i>{{ card.metrics[0].label }}</i>
        </template>
        <span v-if="card.metrics[1]" class="bm-folio__sub">
          <b>{{ card.metrics[1].value }}<small v-if="card.metrics[1].unit">{{ card.metrics[1].unit }}</small></b>
          <i>{{ card.metrics[1].label }}</i>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bm-folio {
  --bm-ink: #e8f4fc;
  --bm-mute: #9ec4dc;
  --bm-line: rgba(160, 214, 236, 0.2);
  --bm-accent: #7ad8ee;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
  padding: 2px 0 24px;
}

.bm-folio__mast {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  flex: 0 0 96px;
  min-height: 0;
}

.bm-folio__hero {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  margin: 0;
  padding: 0 10px;

  + .bm-folio__hero {
    box-shadow: inset 1px 0 0 var(--bm-line);
  }

  strong {
    color: var(--bm-accent);
    font-family: 'Bahnschrift', 'DIN Alternate', ui-monospace, sans-serif;
    font-size: 42px;
    font-weight: 650;
    line-height: 0.92;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;

    small {
      margin-left: 4px;
      color: var(--bm-mute);
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0;
    }
  }

  span {
    color: var(--bm-ink);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.06em;
  }
}

.bm-folio__index {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  flex: 1 1 0;
  min-height: 0;
  border-top: 1px solid var(--bm-line);
}

.bm-folio__key {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  min-width: 0;
  min-height: 0;
  padding: 8px 8px 10px;
  border: none;
  background: transparent;
  text-align: left;
  color: inherit;
  cursor: pointer;

  + .bm-folio__key {
    box-shadow: inset 1px 0 0 var(--bm-line);
  }

  &:hover,
  &:focus-visible {
    background: rgba(90, 180, 220, 0.08);
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 2px solid var(--bm-accent);
    outline-offset: -2px;
  }

  em {
    color: var(--bm-ink);
    font-size: 17px;
    font-style: normal;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  > b {
    color: var(--bm-accent);
    font-family: 'Bahnschrift', 'DIN Alternate', ui-monospace, sans-serif;
    font-size: 34px;
    font-weight: 650;
    line-height: 1;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;

    small {
      margin-left: 3px;
      color: var(--bm-mute);
      font-size: 14px;
      font-weight: 600;
    }
  }

  > i {
    color: var(--bm-mute);
    font-size: 14px;
    font-style: normal;
    font-weight: 700;
    line-height: 1.2;
  }
}

.bm-folio__sub {
  display: flex;
  flex-direction: column;
  gap: 2px;

  b {
    color: var(--bm-ink);
    font-family: 'Bahnschrift', 'DIN Alternate', ui-monospace, sans-serif;
    font-size: 22px;
    font-weight: 650;
    line-height: 1;
    font-variant-numeric: tabular-nums;

    small {
      margin-left: 2px;
      color: var(--bm-mute);
      font-size: 13px;
      font-weight: 600;
    }
  }

  i {
    color: var(--bm-mute);
    font-size: 13px;
    font-style: normal;
    font-weight: 600;
    line-height: 1.2;
  }
}
</style>
