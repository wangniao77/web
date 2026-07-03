<script setup lang="ts">
import type { SchoolEventVM } from '@/domains/university/types/view'

defineProps<{ event: SchoolEventVM }>()
</script>

<template>
  <article class="signal" :class="{ 'signal--alert': event.needsAttention }">
    <span class="signal__edge" aria-hidden="true" />
    <div class="signal__top">
      <span class="signal__tag">{{ event.categoryLabel }}</span>
      <span v-if="event.needsAttention" class="signal__alert">
        <i class="signal__alert-dot" />需关注
      </span>
    </div>
    <h5 class="signal__title">{{ event.title }}</h5>
    <div class="signal__foot">
      <span class="signal__date">{{ event.date }}</span>
      <span class="signal__status">{{ event.statusLabel }}</span>
    </div>
  </article>
</template>

<style scoped lang="scss">
.signal {
  position: relative;
  padding: 9px 13px 9px 15px;
  overflow: hidden;
  background: linear-gradient(150deg, rgba(13, 32, 58, 0.55), rgba(8, 20, 38, 0.4));
  border: 1px solid rgba(90, 170, 255, 0.12);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%);

  &__edge {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--uni-accent-cyan);
    box-shadow: 0 0 8px rgba(51, 217, 255, 0.6);
  }

  &--alert {
    background: linear-gradient(150deg, rgba(58, 30, 30, 0.4), rgba(38, 18, 22, 0.35));
    border-color: rgba(255, 107, 120, 0.22);

    .signal__edge {
      background: var(--uni-status-danger);
      box-shadow: 0 0 8px rgba(255, 107, 120, 0.6);
    }
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
  }

  &__tag {
    padding: 2px 9px;
    font-size: 12px;
    color: var(--uni-accent-blue);
    background: rgba(75, 141, 255, 0.12);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 5px 100%, 0 calc(100% - 5px));
  }

  &__alert {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--uni-status-danger);
  }

  &__alert-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--uni-status-danger);
    box-shadow: 0 0 6px var(--uni-status-danger);
    animation: signal-blink 1.8s ease-in-out infinite;
  }

  &__title {
    font-size: var(--uni-fs-body);
    font-weight: 500;
    color: var(--uni-text-primary);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 6px;
  }

  &__foot {
    display: flex;
    gap: 14px;
    font-size: 12px;
    color: var(--uni-text-muted);
  }
}

@keyframes signal-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
</style>
