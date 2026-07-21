<script setup lang="ts">
defineProps<{ title: string; sub?: string; wide?: boolean; compact?: boolean }>()
</script>

<template>
  <div class="chart-card" :class="{ 'chart-card--compact': compact, 'chart-card--wide': wide }">
    <header class="chart-card__head">
      <span class="chart-card__bar" aria-hidden="true" />
      <h3 class="chart-card__title">{{ title }}</h3>
      <span v-if="sub" class="chart-card__sub">{{ sub }}</span>
    </header>

    <div class="chart-card__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="chart-card__foot">
      <slot name="footer" />
    </footer>
  </div>
</template>

<style scoped lang="scss">
.chart-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 404px;
  border: 1px solid rgba(102, 217, 255, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.16), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.54);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(0, 184, 255, 0.06);
  padding: 12px 14px 10px;
  min-height: 0;
  overflow: hidden;

  &--compact {
    height: 332px;
  }

  &--wide {
    grid-column: span 2;
    height: 388px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.62), transparent);
  }
}

.chart-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-shrink: 0;
}

.chart-card__bar {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00e5ff, #00b8ff);
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.45);
  flex-shrink: 0;
}

.chart-card__title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #f4fbff;
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.18);
}

.chart-card__sub {
  margin-left: auto;
  font-size: 12px;
  color: rgba(184, 236, 255, 0.6);
  white-space: nowrap;
}

.chart-card__body {
  flex: 1;
  min-height: 0;
  padding: 2px 0;
}

.chart-card__foot {
  flex-shrink: 0;
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed rgba(0, 212, 255, 0.1);
}
</style>
