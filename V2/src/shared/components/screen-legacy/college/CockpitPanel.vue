<script setup lang="ts">
defineProps<{
  number: number
  title: string
  icon?: string
  panelClass?: string
}>()
</script>

<template>
  <section class="panel panel--section" :class="panelClass">
    <div class="panel__title">
      <span class="panel__number">{{ number }}</span>
      <span v-if="icon" class="panel__icon">
        <svg aria-hidden="true"><use :href="`/icons.svg#${icon}`" /></svg>
      </span>
      <span class="panel__label">{{ title }}</span>
    </div>
    <div class="panel__body">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.panel__icon svg {
  width: 15px;
  height: 15px;
  color: #42d8ff;
}
</style>
