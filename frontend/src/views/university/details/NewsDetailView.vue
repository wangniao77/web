<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import UniversityDetailLayout from '@/components/university/UniversityDetailLayout.vue'
import { universityDetailService } from '@/api/university/services/details'
import type { NewsDetailVM } from '@/types/university/view/details'

const data = ref<NewsDetailVM | null>(null)
const loading = ref(true)
const activeTag = ref<'all' | 'important' | 'headline' | 'notice'>('all')

onMounted(async () => {
  loading.value = true
  try {
    data.value = await universityDetailService.fetchNewsDetail()
  } finally {
    loading.value = false
  }
})

const filteredItems = computed(() => {
  if (!data.value) return []
  if (activeTag.value === 'all') return data.value.items
  return data.value.items.filter((item) => item.tag === activeTag.value)
})

const tagFilters = [
  { key: 'all' as const, label: '全部' },
  { key: 'important' as const, label: '重要' },
  { key: 'headline' as const, label: '要闻' },
  { key: 'notice' as const, label: '通知' },
]
</script>

<template>
  <UniversityDetailLayout title="学校大事 / 新闻播报" subtitle="全校新闻动态">
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <template v-else-if="data">
      <div class="filter-row">
        <button
          v-for="filter in tagFilters"
          :key="filter.key"
          type="button"
          class="filter-btn"
          :class="{ active: activeTag === filter.key }"
          @click="activeTag = filter.key"
        >
          {{ filter.label }}
        </button>
      </div>

      <div class="news-list">
        <article v-for="item in filteredItems" :key="item.id" class="news-card">
          <header>
            <span class="news-tag" :class="`news-tag--${item.tag}`">{{ item.tagLabel }}</span>
            <time>{{ item.date }}</time>
          </header>
          <h3>{{ item.title }}</h3>
          <p class="summary">{{ item.summary }}</p>
          <p class="content">{{ item.content }}</p>
          <footer v-if="item.source">来源：{{ item.source }}</footer>
        </article>
      </div>
    </template>
  </UniversityDetailLayout>
</template>

<style scoped lang="scss">
.detail-placeholder {
  color: rgba(174, 198, 230, 0.7);
}

.filter-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.filter-btn {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(0, 184, 255, 0.25);
  background: rgba(0, 184, 255, 0.06);
  color: rgba(174, 198, 230, 0.78);
  cursor: pointer;
  font-size: $college-fs-body;

  &.active {
    color: #00e5ff;
    border-color: rgba(0, 212, 255, 0.45);
    background: rgba(0, 184, 255, 0.15);
  }
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.news-card {
  padding: 14px;
  border-radius: 8px;
  border: 1px solid rgba(102, 217, 255, 0.12);
  background: rgba(4, 14, 38, 0.55);

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    time {
      font-size: $college-fs-label;
      color: rgba(174, 198, 230, 0.55);
    }
  }

  h3 {
    font-size: 16px;
    color: #f3f8ff;
    margin-bottom: 6px;
  }
}

.news-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;

  &--important {
    color: #ffb4b4;
    background: rgba(255, 80, 80, 0.18);
  }

  &--headline {
    color: #8ef6ff;
    background: rgba(0, 120, 220, 0.22);
  }

  &--notice {
    color: #9dffd4;
    background: rgba(30, 180, 120, 0.2);
  }
}

.summary {
  font-size: $college-fs-body;
  color: rgba(174, 198, 230, 0.78);
  margin-bottom: 8px;
  line-height: 1.5;
}

.content {
  font-size: $college-fs-body;
  color: rgba(174, 198, 230, 0.65);
  line-height: 1.6;
  margin-bottom: 8px;
}

footer {
  font-size: $college-fs-label;
  color: rgba(174, 198, 230, 0.5);
}
</style>
