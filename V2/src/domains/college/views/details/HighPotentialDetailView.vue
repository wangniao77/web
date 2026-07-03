<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import CollegeDetailLayout from '@/domains/college/components/CollegeDetailLayout.vue'
import { collegeDetailService } from '@/domains/college/services/details'
import { useScope } from '@/shared/composables/useScope'
import type { HighPotentialModuleVM, HighPotentialOverviewVM } from '@/domains/college/types/view/details'

const route = useRoute()
const { collegeScope } = useScope()
const overview = ref<HighPotentialOverviewVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const module = computed<HighPotentialModuleVM | null>(() => {
  const moduleId = String(route.params.moduleId ?? '')
  return overview.value?.modules.find((item) => item.id === moduleId) ?? null
})

async function load() {
  loading.value = true
  error.value = null
  try {
    overview.value = await collegeDetailService.fetchHighPotentialOverview(collegeScope.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

watch(() => route.params.moduleId, load)
watch(collegeScope, load, { deep: true })

onMounted(load)
</script>

<template>
  <CollegeDetailLayout
    title="高潜学生发展画像"
    :subtitle="module ? `${module.title} · 详情` : '维度详情'"
  >
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <div v-else-if="error" class="detail-error">
      <p>{{ error }}</p>
      <button type="button" @click="load">重试</button>
    </div>
    <template v-else-if="module">
      <p class="module-desc">{{ module.desc }}</p>

      <div v-if="module.stats?.length" class="stat-grid">
        <div v-for="item in module.stats" :key="item.label" class="stat-item">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}<small v-if="item.unit">{{ item.unit }}</small></strong>
        </div>
      </div>

      <div v-if="module.highlights?.length" class="stat-grid">
        <div v-for="item in module.highlights" :key="item.label" class="stat-item">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}<small v-if="item.unit">{{ item.unit }}</small></strong>
        </div>
      </div>

      <div v-if="module.tags?.length" class="tag-list">
        <span v-for="tag in module.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>

      <ul v-if="module.timeline?.length" class="timeline">
        <li v-for="item in module.timeline" :key="`${item.date}-${item.title}`">
          <span>{{ item.date }}</span>
          <strong>{{ item.title }}</strong>
          <em>{{ item.level }}</em>
        </li>
      </ul>

      <ul v-if="module.aiRecommend?.length" class="bullet-list">
        <li v-for="item in module.aiRecommend" :key="item">{{ item }}</li>
      </ul>

      <ul v-if="module.events?.length" class="bullet-list">
        <li v-for="item in module.events" :key="item">{{ item }}</li>
      </ul>
    </template>
    <div v-else class="detail-placeholder">未找到对应维度</div>
  </CollegeDetailLayout>
</template>

<style scoped lang="scss">
.detail-placeholder {
  color: rgba(174, 198, 230, 0.7);
}

.detail-error {
  display: grid;
  place-items: center;
  gap: 12px;
  min-height: 200px;
  color: rgba(174, 198, 230, 0.7);

  button {
    color: $color-accent;
    text-decoration: underline;
  }
}

.module-desc {
  margin-bottom: 12px;
  font-size: $college-fs-body;
  color: rgba(174, 198, 230, 0.78);
  line-height: 1.6;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.stat-item {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid rgba(102, 217, 255, 0.12);
  background: rgba(4, 14, 38, 0.55);

  span {
    display: block;
    font-size: $college-fs-meta;
    color: rgba(174, 198, 230, 0.62);
    margin-bottom: 4px;
  }

  strong {
    font-family: var(--college-font-number);
    color: #55dfff;

    small {
      margin-left: 2px;
      font-size: $college-fs-meta;
    }
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.tag {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: $college-fs-meta;
  color: #55dfff;
  border: 1px solid rgba(0, 184, 255, 0.2);
  background: rgba(0, 184, 255, 0.08);
}

.timeline,
.bullet-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.timeline li {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(4, 14, 38, 0.55);
  font-size: $college-fs-label;

  span { color: rgba(174, 198, 230, 0.62); }
  strong { color: #f3f8ff; }
  em { color: #f4c84f; font-style: normal; }
}

.bullet-list li {
  padding-left: 12px;
  position: relative;
  font-size: $college-fs-label;
  color: rgba(174, 198, 230, 0.78);

  &::before {
    content: '•';
    position: absolute;
    left: 0;
    color: #55dfff;
  }
}
</style>
