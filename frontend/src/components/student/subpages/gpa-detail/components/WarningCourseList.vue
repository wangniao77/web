<script setup lang="ts">
/**
 * GPA 详情页 · 待提升课程列表（< 75 分）
 *
 * 与"预警"略有不同：这里不仅列出低分课程，还会给出该课程的"潜力方向"建议。
 */
import { computed } from 'vue'
import type { CourseRecordVM } from '../../_shared/gpa-data'

const props = withDefaults(
  defineProps<{
    courses: CourseRecordVM[]
    max?: number
  }>(),
  { max: 8 },
)

const display = computed(() => props.courses.slice(0, props.max))

/** 根据课程类别给一个"潜力方向"建议文案 */
function suggestPotential(c: CourseRecordVM): string {
  const map: Record<string, string> = {
    'major-core': '建议参加考研 / 补考，争取覆盖核心课成绩',
    'major-base': '可结合 AI 工具辅助理解，补强基础概念',
    'elective':    '如兴趣不大可考虑替换为更擅长的方向选修',
    'general':     '通识课可刷往年题 / 关注平时分比重',
    'humanity':    '阅读相关拓展材料，提升综合素养',
    'art':         '保持规律训练，逐步提升',
    'practice':    '在实战项目中深化理解',
  }
  return map[c.category] || '建议增加学习时间或寻求老师指导'
}
</script>

<template>
  <div class="course-list warning">
    <header class="list-head">
      <span class="list-bar" aria-hidden="true" />
      <h3 class="list-title">待提升课程</h3>
      <span class="list-meta">&lt; 75 分 · 共 {{ courses.length }} 门</span>
    </header>

    <ol v-if="display.length" class="list-body">
      <li v-for="c in display" :key="c.id" class="list-row">
        <div class="info">
          <div class="name-row">
            <span class="name">{{ c.name }}</span>
            <span class="category">{{ c.categoryLabel }}</span>
          </div>
          <p class="tip">
            <span class="tip-label">建议</span>
            <span class="tip-text">{{ suggestPotential(c) }}</span>
          </p>
        </div>
        <div class="score">
          <span class="score-num">{{ c.score }}</span>
          <span class="score-gpa">GPA {{ c.gpaPoint.toFixed(1) }}</span>
        </div>
      </li>
    </ol>

    <div v-else class="empty">暂无待提升课程</div>
  </div>
</template>

<style scoped lang="scss">
.course-list {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(102, 217, 255, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.16), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.54);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(0, 184, 255, 0.06);
  padding: 12px 14px 10px;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  &.warning::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(240, 192, 64, 0.62), transparent);
  }
}

.list-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.list-bar {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(180deg, #f0c040, #d97706);
  box-shadow: 0 0 6px rgba(240, 192, 64, 0.45);
  flex-shrink: 0;
}

.list-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #f4fbff;
  text-shadow: 0 0 10px rgba(240, 192, 64, 0.18);
}

.list-meta {
  margin-left: auto;
  font-size: 12px;
  color: rgba(184, 236, 255, 0.6);
}

.list-body {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 184, 255, 0.3) transparent;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 184, 255, 0.3); border-radius: 2px; }
}

.list-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(240, 192, 64, 0.05);
  border: 1px solid rgba(240, 192, 64, 0.12);
  border-left: 3px solid rgba(240, 192, 64, 0.5);
  transition: background 0.2s, transform 0.2s;

  &:hover {
    background: rgba(240, 192, 64, 0.1);
    transform: translateX(2px);
  }
}

.info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.name {
  font-size: 14px;
  font-weight: 600;
  color: #f0f6ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(0, 184, 255, 0.12);
  color: #9eefff;
  white-space: nowrap;
  flex-shrink: 0;
}

.tip {
  margin: 0;
  font-size: 11px;
  color: rgba(184, 236, 255, 0.7);
  line-height: 1.4;
  display: flex;
  gap: 4px;
  align-items: flex-start;
}

.tip-label {
  flex-shrink: 0;
  font-weight: 600;
  color: #f0c040;
  padding: 0 4px;
  border-radius: 2px;
  background: rgba(240, 192, 64, 0.1);
  border: 1px solid rgba(240, 192, 64, 0.22);
  align-self: flex-start;
  line-height: 1.45;

  &::after { content: '：'; }
}

.score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
  flex-shrink: 0;
}

.score-num {
  font-family: 'DIN Alternate', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #f0c040;
  line-height: 1.1;
  text-shadow: 0 0 10px rgba(240, 192, 64, 0.4);
}

.score-gpa {
  font-size: 11px;
  color: rgba(184, 236, 255, 0.6);
}

.empty {
  flex: 1;
  display: grid;
  place-items: center;
  font-size: 13px;
  color: rgba(184, 236, 255, 0.5);
}
</style>
