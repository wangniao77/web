<script setup lang="ts">
/**
 * GPA 详情页 · 优秀课程 Top 列表（≥90 分）
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
</script>

<template>
  <div class="course-list excellent">
    <header class="list-head">
      <span class="list-bar" aria-hidden="true" />
      <h3 class="list-title">优秀课程 TOP</h3>
      <span class="list-meta">≥ 90 分 · 共 {{ courses.length }} 门</span>
    </header>

    <ol v-if="display.length" class="list-body">
      <li v-for="(c, i) in display" :key="c.id" class="list-row">
        <span class="rank">NO.{{ i + 1 }}</span>
        <div class="info">
          <div class="name-row">
            <span class="name">{{ c.name }}</span>
            <span class="category">{{ c.categoryLabel }}</span>
          </div>
          <div class="meta-row">
            <span class="semester">{{ c.semester }}</span>
            <span class="dot">·</span>
            <span class="credit">{{ c.credit }} 学分</span>
          </div>
        </div>
        <div class="score">
          <span class="score-num">{{ c.score }}</span>
          <span class="score-gpa">GPA {{ c.gpaPoint.toFixed(1) }}</span>
        </div>
      </li>
    </ol>

    <div v-else class="empty">暂无优秀课程记录</div>
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

  &.excellent::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.62), transparent);
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
  background: linear-gradient(180deg, #34d399, #10b981);
  box-shadow: 0 0 6px rgba(52, 211, 153, 0.45);
  flex-shrink: 0;
}

.list-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #f4fbff;
  text-shadow: 0 0 10px rgba(52, 211, 153, 0.18);
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
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 6px;
  background: rgba(52, 211, 153, 0.05);
  border: 1px solid rgba(52, 211, 153, 0.12);
  border-left: 3px solid rgba(52, 211, 153, 0.5);
  transition: background 0.2s, transform 0.2s;

  &:hover {
    background: rgba(52, 211, 153, 0.1);
    transform: translateX(2px);
  }
}

.rank {
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  color: #f0c040;
  font-family: 'DIN Alternate', sans-serif;
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(240, 192, 64, 0.1);
  border: 1px solid rgba(240, 192, 64, 0.28);
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  max-width: 60%;
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

.meta-row {
  font-size: 11px;
  color: rgba(184, 236, 255, 0.55);
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot { color: rgba(184, 236, 255, 0.3); }

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
  color: #34d399;
  line-height: 1.1;
  text-shadow: 0 0 10px rgba(52, 211, 153, 0.4);
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
