<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { ScrollBoard } from '@kjgl77/datav-vue3'
import CollegePanelCard from '@/domains/college/components/CollegePanelCard.vue'
import { STUDENT_SCROLL_BOARD } from '@/domains/student/constants/datav-theme'
import type {
  AiAssistantVM,
  AttentionItemVM,
  EmploymentVM,
  HighlightItemVM,
} from '@/domains/student/types/view'

const Caibao3D = defineAsyncComponent(() => import('@/domains/student/components/mascot/Caibao3D.vue'))

const props = defineProps<{
  data: AiAssistantVM
  highlights: HighlightItemVM[]
  attention: AttentionItemVM[]
  employment: EmploymentVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const highlightBoardConfig = computed(() => ({
  header: [],
  data: props.highlights.map((item) => [item.label, item.date ?? '—']),
  rowNum: Math.min(4, Math.max(props.highlights.length, 1)),
  headerHeight: 0,
  columnWidth: [180, 72],
  align: ['left', 'right'] as const,
  index: false,
  ...STUDENT_SCROLL_BOARD,
}))
</script>

<template>
  <CollegePanelCard
    :index="3"
    :title="data.title"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="ai-assistant">
      <div class="ai-header">
        <div class="mascot-wrap">
          <Caibao3D :size="58" />
          <span class="mascot-label">财宝</span>
        </div>
        <div class="direction">
          <span class="dir-label">主要推荐方向</span>
          <strong class="dir-value">{{ data.recommendedDirection }}</strong>
        </div>
      </div>

      <div class="insight-row">
        <div class="section">
          <span class="section-label">
            成长亮点
            <em v-if="highlights.length" class="more-count">{{ highlights.length }}</em>
          </span>
          <ScrollBoard
            v-if="highlights.length"
            :config="highlightBoardConfig"
            class="highlight-board"
          />
          <p v-else class="highlight-empty">暂无成长亮点记录</p>
        </div>

        <div class="section">
          <span class="section-label">需关注事项</span>
          <ul class="attention-list">
            <li
              v-for="item in attention"
              :key="item.id"
              :class="`level-${item.level}`"
            >
              <span class="category-tag">{{ item.category }}</span>
              <span class="item-label">{{ item.label }}</span>
              <span class="level-tag">{{ item.levelLabel }}</span>
            </li>
            <li v-if="!attention.length" class="empty">暂无需要关注的事项</li>
          </ul>
        </div>
      </div>

      <div class="employment-section">
        <div class="readiness-row">
          <span>就业就绪 <em>{{ employment.jobReadiness }}%</em></span>
          <span>证书就绪 <em>{{ employment.certificateReadiness }}%</em></span>
        </div>
        <p class="emp-line">
          <span class="emp-label">职业方向：</span>
          <span class="emp-text">{{ employment.careerDirections.join('、') }}</span>
        </p>
      </div>

      <div class="section basis-section">
        <span class="section-label">匹配依据</span>
        <ul class="basis-list">
          <li v-for="(item, i) in data.matchBasis" :key="i">{{ item }}</li>
        </ul>
      </div>

      <div class="advice-row">
        <div class="section">
          <span class="section-label">短期建议</span>
          <ul class="suggest-list">
            <li v-for="(item, i) in data.shortTermSuggestions" :key="i">{{ item }}</li>
          </ul>
        </div>
        <div class="section">
          <span class="section-label">长期规划</span>
          <ul class="suggest-list long">
            <li v-for="(item, i) in data.longTermSuggestions" :key="i">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>
  </CollegePanelCard>
</template>

<style scoped lang="scss">
.ai-assistant {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 9px;
  overflow: hidden;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.12);
  flex-shrink: 0;
}

.mascot-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.mascot-label {
  font-size: $college-fs-meta;
  color: rgba(240, 192, 64, 0.85);
  font-weight: 600;
}

.direction {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dir-label {
  font-size: $college-fs-meta;
  color: rgba(186, 208, 236, 0.78);
}

.dir-value {
  font-size: $college-fs-body;
  color: $color-accent-cyan;
  font-weight: 600;
}

.insight-row {
  flex: 1 1 auto;
  min-height: 140px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-height: 0;
}

.section-label {
  font-size: $college-fs-meta;
  color: rgba(210, 228, 252, 0.9);
  font-weight: 600;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  padding-left: 8px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 11px;
    border-radius: 2px;
    background: rgba(0, 212, 255, 0.6);
  }

  .more-count {
    font-style: normal;
    font-weight: 700;
    margin-left: 4px;
    color: rgba(240, 192, 64, 0.9);
    font-family: var(--student-font-number, inherit);
  }
}

.highlight-board {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;

  :deep(.rows) {
    font-size: $college-fs-label;
  }

  :deep(.ceil) {
    color: rgba(224, 238, 255, 0.94) !important;
    padding: 0 4px;
  }

  :deep(.row-item) {
    border-bottom: 1px solid rgba(0, 212, 255, 0.06);
  }
}

.highlight-empty {
  margin: 0;
  padding: 8px 4px;
  font-size: $college-fs-label;
  color: rgba(186, 208, 236, 0.62);
}

.attention-list {
  list-style: none;
  margin: 0;
  padding: 0 4px 0 0;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 212, 255, 0.28) transparent;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.28);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.attention-list li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 5px 6px;
  margin-bottom: 3px;
  border-radius: 5px;
  border: 1px solid rgba(248, 113, 113, 0.15);
  background: rgba(248, 113, 113, 0.06);
}

.item-label {
  display: block;
  font-size: $college-fs-label;
  color: rgba(224, 238, 255, 0.94);
  line-height: 1.4;
}

.attention-list li.level-high {
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.1);
}

.attention-list li.level-medium {
  border-color: rgba(251, 146, 60, 0.25);
  background: rgba(251, 146, 60, 0.06);
}

.attention-list li.level-low {
  border-color: rgba(240, 192, 64, 0.2);
  background: rgba(240, 192, 64, 0.05);
}

.category-tag {
  font-size: $college-fs-meta;
  color: $color-danger;
  font-weight: 600;
}

.level-tag {
  align-self: flex-end;
  font-size: $college-fs-meta;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(248, 113, 113, 0.15);
  color: $color-danger;
}

.level-medium .level-tag {
  background: rgba(251, 146, 60, 0.15);
  color: $color-warning;
}

.level-low .level-tag {
  background: rgba(240, 192, 64, 0.12);
  color: $color-accent-gold;
}

.attention-list li.empty {
  align-items: center;
  color: $color-success;
  background: rgba(52, 211, 153, 0.06);
  border-color: rgba(52, 211, 153, 0.2);
}

.employment-section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 9px;
  border-radius: 6px;
  background: rgba(139, 92, 246, 0.07);
  border: 1px solid rgba(139, 92, 246, 0.18);
}

.readiness-row {
  display: flex;
  gap: 14px;
  font-size: $college-fs-label;
  color: rgba(200, 218, 244, 0.82);

  em {
    font-style: normal;
    color: $color-accent-cyan;
    font-family: var(--student-font-number, inherit);
    font-weight: 700;
    margin-left: 4px;
  }
}

.emp-line {
  margin: 0;
  font-size: $college-fs-label;
  line-height: 1.3;
  display: flex;
  gap: 3px;
}

.emp-label {
  flex-shrink: 0;
  color: rgba(186, 208, 236, 0.7);
}

.emp-text {
  color: rgba(224, 238, 255, 0.92);
}

.basis-section {
  flex-shrink: 0;
}

.basis-list,
.suggest-list {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    font-size: $college-fs-label;
    color: rgba(224, 238, 255, 0.92);
    padding: 2px 0 2px 12px;
    position: relative;
    line-height: 1.4;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 9px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(0, 212, 255, 0.6);
    }
  }
}

.advice-row {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.suggest-list.long li::before {
  background: rgba(240, 192, 64, 0.6);
}
</style>
