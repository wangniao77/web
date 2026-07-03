<script setup lang="ts">
import { computed } from 'vue'
import { ScrollBoard } from '@kjgl77/datav-vue3'
import CollegePanelCard from '@/domains/college/components/CollegePanelCard.vue'
import UniversityPanelBorder from '@/domains/university/components/UniversityPanelBorder.vue'
import { UNIVERSITY_SCROLL_BOARD } from '@/domains/university/constants/datav-theme'
import { ROUTES } from '@/constants/routes'
import type { NewsItemVM } from '@/domains/university/types/view'

const props = defineProps<{
  items: NewsItemVM[]
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const boardConfig = computed(() => ({
  header: ['标签', '标题', '日期'],
  data: props.items.map((item) => [
    `<span class="news-tag news-tag--${item.tag}">${item.tagLabel}</span>`,
    item.title,
    item.date,
  ]),
  rowNum: Math.min(5, Math.max(props.items.length, 1)),
  headerHeight: 28,
  columnWidth: [56, 999, 52],
  align: ['center', 'left', 'center'] as const,
  index: false,
  ...UNIVERSITY_SCROLL_BOARD,
}))
</script>

<template>
  <UniversityPanelBorder variant="8">
    <CollegePanelCard
      :index="4"
      title="学校大事 / 新闻播报"
      :loading="loading"
      :error="error"
      show-more
      :more-to="ROUTES.university.news"
      @retry="$emit('retry')"
    >
      <ScrollBoard v-if="items.length" :config="boardConfig" class="news-board" />
      <p v-else class="news-empty">暂无新闻动态</p>
    </CollegePanelCard>
  </UniversityPanelBorder>
</template>

<style scoped lang="scss">
.news-board {
  width: 100%;
  height: 100%;
  min-height: 120px;
}

.news-empty {
  color: rgba(174, 198, 230, 0.6);
  font-size: 13px;
  text-align: center;
  padding: 24px;
}

:deep(.news-tag) {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}

:deep(.news-tag--important) {
  color: #ffb4b4;
  background: rgba(255, 80, 80, 0.18);
  border: 1px solid rgba(255, 100, 100, 0.35);
}

:deep(.news-tag--headline) {
  color: #8ef6ff;
  background: rgba(0, 120, 220, 0.22);
  border: 1px solid rgba(0, 200, 255, 0.35);
}

:deep(.news-tag--notice) {
  color: #9dffd4;
  background: rgba(30, 180, 120, 0.2);
  border: 1px solid rgba(46, 230, 168, 0.35);
}
</style>
