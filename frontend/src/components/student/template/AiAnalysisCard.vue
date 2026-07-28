<script setup lang="ts">
/**
 * AI 学业分析卡片（可复用）
 * 用于预警详情页「状态总览」下方，展示一段 AI 生成的学业分析结论。
 * 样式对齐「学情轨迹护航详情」页的 AI 学业分析区块。
 */
defineProps<{
  text: string
  title?: string
}>()
</script>

<template>
  <section class="ai-analysis-card">
    <span class="ai-analysis-card__tag">{{ title ?? 'AI 学业分析' }}</span>
    <p class="ai-analysis-card__text">{{ text }}</p>
  </section>
</template>

<style scoped lang="scss">
.ai-analysis-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 20px;
  border-radius: 8px;
  background:
    linear-gradient(120deg, rgba(0, 113, 206, 0.22), rgba(3, 12, 34, 0.7)),
    rgba(5, 18, 48, 0.55);
  border: 1px solid rgba(102, 217, 255, 0.2);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.2), inset 0 0 22px rgba(0, 184, 255, 0.07);

  &__tag {
    align-self: flex-start;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    color: #8ef6ff;
    background: rgba(0, 184, 255, 0.14);
    border: 1px solid rgba(0, 184, 255, 0.3);
  }

  &__text {
    margin: 0;
    font-size: 15px;
    line-height: 1.8;
    color: #dbeeff;
  }
}
</style>
