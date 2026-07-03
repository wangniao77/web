<script setup lang="ts">
import { computed } from 'vue'
import ChartContainer from '@/shared/components/charts/ChartContainer.vue'
import { uniTerrain } from '@/domains/university/charts/presets'

const props = defineProps<{
  categories: string[]
  layers: Array<{ name: string; data: number[]; color: string }>
}>()

const option = computed(() => uniTerrain(props.categories, props.layers))
</script>

<template>
  <ChartContainer :option="option" class="terrain" />
</template>

<style scoped lang="scss">
.terrain {
  width: 100%;
  height: 100%;
}
</style>
