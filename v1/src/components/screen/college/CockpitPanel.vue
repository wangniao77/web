<script setup lang="ts">
import DashIcon, { type IconKind } from '@/components/DashIcon.vue'

defineProps<{
  number: number
  title: string
  icon?: IconKind
  panelClass?: string
}>()
</script>

<template>
  <section class="panel panel--section" :class="panelClass">
    <div class="panel__title">
      <span class="panel__number">{{ number }}</span>
      <span v-if="icon" class="panel__icon">
        <DashIcon :kind="icon" :size="15" />
      </span>
      <span class="panel__label">{{ title }}</span>
    </div>
    <div class="panel__body">
      <slot />
    </div>
  </section>
</template>
