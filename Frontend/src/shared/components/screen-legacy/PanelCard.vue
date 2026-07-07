<script setup lang="ts">
defineProps<{
  title: string
  index?: number
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <section class="panel-card">
    <header class="panel-header">
      <span v-if="index != null" class="panel-index">{{ index }}</span>
      <h3 class="panel-title">{{ title }}</h3>
      <div class="panel-decor" />
    </header>
    <div v-if="loading" class="panel-body panel-loading">加载中...</div>
    <div v-else-if="error" class="panel-body panel-error">
      <span>{{ error }}</span>
      <button type="button" @click="$emit('retry')">重试</button>
    </div>
    <div v-else class="panel-body">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.panel-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: $color-bg-card;
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: $panel-radius;
  position: relative;
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    border-color: $color-accent;
    border-style: solid;
    opacity: 0.6;
  }

  &::before {
    top: 0;
    left: 0;
    border-width: 2px 0 0 2px;
  }

  &::after {
    bottom: 0;
    right: 0;
    border-width: 0 2px 2px 0;
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.15);
  flex-shrink: 0;
}

.panel-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 12px;
  font-weight: 700;
  color: $color-accent-gold;
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 2px;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: $color-text-primary;
  white-space: nowrap;
}

.panel-decor {
  flex: 1;
  height: 1px;
  margin-left: 8px;
  background: linear-gradient(90deg, rgba(0, 212, 255, 0.4), transparent);
}

.panel-body {
  flex: 1;
  padding: 8px 12px;
  min-height: 0;
  overflow: hidden;
}

.panel-loading,
.panel-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: $color-text-secondary;
  font-size: 13px;
}

.panel-error button {
  padding: 2px 8px;
  background: rgba(0, 212, 255, 0.15);
  border: 1px solid rgba(0, 212, 255, 0.4);
  color: $color-accent;
  cursor: pointer;
  border-radius: 2px;
}
</style>
