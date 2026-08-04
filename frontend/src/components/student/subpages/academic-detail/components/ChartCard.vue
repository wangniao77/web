<script setup lang="ts">
defineProps<{ title: string; sub?: string; wide?: boolean; compact?: boolean; fill?: boolean; tall?: boolean }>()
</script>

<template>
  <div
    class="chart-card"
    :class="{
      'chart-card--compact': compact,
      'chart-card--wide': wide,
      'chart-card--fill': fill,
      'chart-card--tall': tall,
    }"
  >
    <div class="chart-card__glow" aria-hidden="true" />
    <header class="chart-card__head">
      <span class="chart-card__bar" aria-hidden="true" />
      <div class="chart-card__titles">
        <h3 class="chart-card__title">{{ title }}</h3>
        <p v-if="sub" class="chart-card__hint">{{ sub }}</p>
      </div>
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
  border: 1px solid rgba(102, 217, 255, 0.22);
  border-radius: 12px;
  background:
    radial-gradient(90% 70% at 100% 100%, rgba(0, 184, 255, 0.1), transparent 55%),
    linear-gradient(160deg, rgba(8, 42, 86, 0.72), rgba(3, 12, 34, 0.88));
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  padding: 14px 16px 12px;
  min-height: 0;
  overflow: hidden;

  &--compact {
    height: 332px;
  }

  &--wide {
    grid-column: span 2;
    height: 388px;
  }

  &--tall {
    height: 540px;
  }

  &--fill {
    height: 100%;
    min-height: 404px;
  }

  &__glow {
    position: absolute;
    inset: auto -15% -35% auto;
    width: 50%;
    height: 65%;
    background: radial-gradient(circle, rgba(0, 229, 255, 0.1), transparent 70%);
    pointer-events: none;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.7), transparent);
  }
}

.chart-card__head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.chart-card__bar {
  width: 3px;
  height: 28px;
  margin-top: 4px;
  border-radius: 2px;
  background: linear-gradient(180deg, #7ff6ff, #00b8ff);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.55);
  flex-shrink: 0;
}

.chart-card__titles {
  min-width: 0;
  flex: 1;
}

.chart-card__title {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #f4fbff;
  text-shadow: 0 0 14px rgba(0, 242, 255, 0.22);
}

.chart-card__hint {
  margin: 4px 0 0;
  font-size: 17px;
  color: rgba(158, 202, 232, 0.78);
}

.chart-card__body {
  flex: 1;
  min-height: 0;
  padding: 2px 0;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.chart-card__foot {
  flex-shrink: 0;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(102, 217, 255, 0.12);
  position: relative;
  z-index: 2;
  background: linear-gradient(180deg, rgba(3, 16, 40, 0.55), rgba(3, 12, 34, 0.92));
}
</style>
