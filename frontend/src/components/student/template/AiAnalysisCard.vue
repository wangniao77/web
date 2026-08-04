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
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 20px;
  border-radius: 10px;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.2), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.55);
  border: 1px solid rgba(102, 217, 255, 0.2);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(0, 184, 255, 0.08);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.55), transparent);
    pointer-events: none;
  }

  &__tag {
    align-self: flex-start;
    padding: 3px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 750;
    color: #8ef6ff;
    background: rgba(0, 184, 255, 0.14);
    border: 1px solid rgba(0, 184, 255, 0.32);
    letter-spacing: 0.04em;
  }

  &__text {
    margin: 0;
    font-size: 15px;
    line-height: 1.75;
    color: #dbeeff;
  }
}
</style>
