<script setup lang="ts">
import type { StudentFooterVM } from '@/domains/student/types/view'

defineProps<{
  data: StudentFooterVM
}>()
</script>

<template>
  <footer class="student-footer">
    <div class="footer-left">
      <span class="motto">{{ data.motto }}</span>
    </div>
    <div class="footer-center">
      <span>成长天数 <em>{{ data.growthDays }}</em></span>
      <span>学期目标完成 <em>{{ data.goalCompletionRate }}%</em></span>
      <span>成长里程碑 <em>{{ data.milestoneCount }}</em></span>
      <span>累计获奖 <em>{{ data.totalAwards }}</em></span>
    </div>
    <div class="footer-right">
      <button type="button" class="ai-btn">与 AI 助手对话</button>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.student-footer {
  height: 56px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 16px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(8, 22, 50, 0.85), rgba(3, 11, 31, 0.75)),
    rgba(6, 17, 52, 0.6);
  border: 1px solid rgba(93, 198, 255, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.footer-left {
  overflow: hidden;
}

.motto {
  font-size: $college-fs-label;
  color: rgba(191, 213, 240, 0.76);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.footer-center {
  display: flex;
  gap: 24px;
  font-size: $college-fs-label;
  color: rgba(174, 198, 230, 0.68);

  em {
    font-style: normal;
    color: $color-accent-cyan;
    font-family: var(--student-font-number, inherit);
    font-weight: 700;
    margin-left: 4px;
  }
}

.footer-right {
  display: flex;
  justify-content: flex-end;
}

.ai-btn {
  padding: 6px 16px;
  border-radius: 16px;
  border: 1px solid rgba(0, 212, 255, 0.35);
  background: linear-gradient(135deg, rgba(0, 184, 255, 0.15), rgba(0, 229, 255, 0.08));
  color: $color-accent-cyan;
  font-size: $college-fs-label;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: rgba(0, 212, 255, 0.6);
    box-shadow: 0 0 12px rgba(0, 184, 255, 0.15);
  }
}
</style>
