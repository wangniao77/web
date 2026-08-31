<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CollegeDetailLayout from '@/components/college/CollegeDetailLayout.vue'
import BenchmarkPillarDeepDive from '@/components/college/modules/benchmark/BenchmarkPillarDeepDive.vue'
import { benchmarkService } from '@/api/college/services/benchmark'
import {
  BENCHMARK_PILLAR_META,
  collectPillarEvidence,
  refinePartyPillar,
  resolvePillarFromQuery,
} from '@/api/college/adapters/benchmark-pillars'
import { useScope } from '@/composables/useScope'
import { ROUTES } from '@/constants/routes'
import type { BenchmarkPillarKey } from '@/types/college/api/benchmark-achievements'
import type {
  BenchmarkAchievementsDetailVM,
  BenchmarkFeaturedVM,
} from '@/types/college/view/benchmark-achievements'

const route = useRoute()
const router = useRouter()
const { collegeScope } = useScope()

const data = ref<BenchmarkAchievementsDetailVM | null>(null)
const featured = ref<BenchmarkFeaturedVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const currentPillar = ref<BenchmarkPillarKey>('research')
const tabBarRef = ref<HTMLElement | null>(null)

const evidence = computed(() => {
  if (!data.value) return []
  return collectPillarEvidence(currentPillar.value, data.value.achievements, featured.value)
})

const pillar = computed(() => {
  const raw = data.value?.pillars.find((item) => item.key === currentPillar.value)
  if (!raw) return null
  return refinePartyPillar(raw, evidence.value.length)
})

function getDetailScroller() {
  const root = tabBarRef.value?.closest<HTMLElement>('.college-detail')
  return root?.querySelector<HTMLElement>('.college-detail__body') ?? null
}

function applyRouteQuery() {
  currentPillar.value = resolvePillarFromQuery(route.query)
}

function switchPillar(key: BenchmarkPillarKey) {
  currentPillar.value = key
  router.replace({ path: ROUTES.college.benchmarkDetail, query: { pillar: key } })
  nextTick(() => {
    getDetailScroller()?.scrollTo({ top: 0, behavior: 'auto' })
  })
}

onMounted(async () => {
  applyRouteQuery()
  // 旧 tab/filter 链接统一落到 pillar，避免空白页
  if (route.query.tab != null || (route.query.filter && !route.query.pillar)) {
    router.replace({
      path: ROUTES.college.benchmarkDetail,
      query: { pillar: currentPillar.value },
    })
  }
  loading.value = true
  error.value = null
  try {
    const [detailRes, featuredRes] = await Promise.all([
      benchmarkService.fetchBenchmarkDetail(collegeScope.value),
      benchmarkService.fetchBenchmarkFeatured(collegeScope.value),
    ])
    data.value = detailRes
    featured.value = featuredRes
    applyRouteQuery()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
})

watch(() => route.query, () => applyRouteQuery())
</script>

<template>
  <CollegeDetailLayout module="精品成果集萃">
    <template #nav>
      <div ref="tabBarRef" class="tab-bar tab-bar--header">
        <button
          v-for="item in BENCHMARK_PILLAR_META"
          :key="item.key"
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': currentPillar === item.key }"
          @click="switchPillar(item.key)"
        >
          {{ item.label }}
        </button>
      </div>
    </template>

    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <div v-else-if="error" class="detail-placeholder detail-error">{{ error }}</div>
    <BenchmarkPillarDeepDive v-else-if="pillar" :pillar="pillar" :evidence="evidence" />
    <div v-else class="detail-placeholder">该板块数据暂不可用</div>
  </CollegeDetailLayout>
</template>

<style scoped lang="scss">
.detail-placeholder {
  display: grid;
  min-height: 220px;
  place-items: center;
  color: rgba(184, 236, 255, 0.72);
  font-size: 24px;
}

.detail-error { color: #ffb4a2; }

.tab-bar {
  display: flex;
  gap: 0;
  border-radius: 8px;
  border: 1px solid rgba(0, 242, 255, 0.18);
  overflow: hidden;
  width: fit-content;
  max-width: 100%;

  &--header {
    flex-wrap: nowrap;
    background: rgba(0, 40, 90, 0.35);
  }
}

.tab-btn {
  padding: 10px 22px;
  border: none;
  border-right: 1px solid rgba(0, 242, 255, 0.12);
  background: rgba(0, 60, 120, 0.18);
  color: #8ec8e8;
  font-size: 22px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s;
  white-space: nowrap;

  &:last-child { border-right: none; }
  &:hover { background: rgba(0, 90, 160, 0.28); color: #b8ecff; }

  &--active {
    background: linear-gradient(180deg, rgba(0, 140, 220, 0.35), rgba(0, 70, 140, 0.3));
    color: #eaf7ff;
    box-shadow: inset 0 0 18px rgba(0, 200, 255, 0.15);
  }
}
</style>
