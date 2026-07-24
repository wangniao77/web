<script setup lang="ts">
withDefaults(
  defineProps<{
    mock?: boolean
    tip?: string
  }>(),
  {
    mock: false,
    tip: '示意数据（缺源 mock）',
  },
)
</script>

<template>
  <span
    class="mock-text"
    :class="{ 'mock-text--mock': mock }"
    :title="mock ? tip : undefined"
  >
    <slot />
  </span>
</template>

<style scoped lang="scss">
.mock-text--mock {
  color: #ff4d4f !important;

  :deep(small),
  :deep(strong),
  :deep(em) {
    color: inherit !important;
  }
}
</style>
