<script setup lang="ts">
import { toRef } from 'vue'
import { useCountUp } from '@/composables/useCountUp'

const props = withDefaults(
  defineProps<{
    value: number
    decimals?: number
    delay?: number
    duration?: number
    suffix?: string
    prefix?: string
  }>(),
  { decimals: 0, delay: 0, duration: 1.4, suffix: '', prefix: '' },
)

const { formatted, play } = useCountUp(toRef(props, 'value'), {
  decimals: props.decimals,
  delay: props.delay,
  duration: props.duration,
})

defineExpose({ play })
</script>

<template>
  <span class="animated-value">{{ prefix }}{{ formatted }}{{ suffix }}</span>
</template>

<style scoped lang="scss">
.animated-value {
  font-variant-numeric: tabular-nums;
}
</style>
