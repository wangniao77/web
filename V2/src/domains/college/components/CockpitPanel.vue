<script setup lang="ts">
import { computed } from 'vue'
import DashIcon, { type IconKind, resolveIconKind } from '@/domains/college/components/DashIcon.vue'

const props = defineProps<{
  number: number
  title: string
  icon?: IconKind | string
  panelClass?: string
}>()

const resolvedIcon = computed(() => (props.icon ? resolveIconKind(props.icon) : undefined))
</script>

<template>
  <section class="panel panel--section" :class="panelClass">
    <div class="panel__title">
      <span class="panel__number">{{ number }}</span>
      <span v-if="resolvedIcon" class="panel__icon">
        <DashIcon :kind="resolvedIcon" :size="15" />
      </span>
      <span class="panel__label">{{ title }}</span>
    </div>
    <div class="panel__body">
      <slot />
    </div>
  </section>
</template>
