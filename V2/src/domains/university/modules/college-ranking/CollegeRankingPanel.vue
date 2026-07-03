<script setup lang="ts">
import CollegePanelCard from '@/domains/college/components/CollegePanelCard.vue'
import UniversityPanelBorder from '@/domains/university/components/UniversityPanelBorder.vue'
import type { CollegeRankingItemVM } from '@/domains/university/types/view'

defineProps<{
  items: CollegeRankingItemVM[]
  formula: string
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <UniversityPanelBorder variant="8">
    <CollegePanelCard
      :index="1"
      title="学院发展表现"
      :loading="loading"
      :error="error"
      @retry="$emit('retry')"
    >
      <div class="ranking-panel">
        <ul class="ranking-list">
          <li
            v-for="item in items"
            :key="item.rank"
            class="ranking-row"
            :class="{ 'ranking-row--top': item.rank <= 3 }"
          >
            <span class="rank-badge" :class="`rank-badge--${item.rank}`">{{ item.rank }}</span>
            <span class="college-name">{{ item.collegeName }}</span>
            <div class="score-bar">
              <i :style="{ width: `${item.score}%` }" />
            </div>
            <strong class="score-value">{{ item.score }}</strong>
            <em class="score-trend" :class="item.trend >= 0 ? 'up' : 'down'">{{ item.trendLabel }}</em>
          </li>
        </ul>
        <p class="ranking-formula">{{ formula }}</p>
      </div>
    </CollegePanelCard>
  </UniversityPanelBorder>
</template>

<style scoped lang="scss">
.ranking-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 8px;
}

.ranking-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ranking-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 1.4fr 42px 36px;
  align-items: center;
  gap: 8px;
  padding: 5px 4px;
  border-radius: 6px;
  background: rgba(0, 50, 100, 0.1);
}

.rank-badge {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 800;
  color: #dff7ff;
  background: rgba(0, 100, 180, 0.25);
  border: 1px solid rgba(0, 212, 255, 0.2);

  &--1 { background: linear-gradient(135deg, #ffd700, #ff9500); color: #1a1200; border-color: transparent; }
  &--2 { background: linear-gradient(135deg, #c0c8d8, #8899aa); color: #0a1020; border-color: transparent; }
  &--3 { background: linear-gradient(135deg, #cd7f32, #a0522d); color: #fff; border-color: transparent; }
}

.college-name {
  font-size: 12px;
  font-weight: 700;
  color: #eef9ff;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.score-bar {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: rgba(7, 55, 128, 0.65);

  i {
    position: absolute;
    inset: 0 auto 0 0;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #0d71ff, #00f2ff);
    box-shadow: 0 0 8px rgba(0, 242, 255, 0.4);
  }
}

.score-value {
  font-size: 13px;
  font-weight: 800;
  color: #00e5ff;
  font-family: var(--university-font-number);
  text-align: right;
}

.score-trend {
  font-size: 10px;
  font-style: normal;
  font-weight: 700;
  text-align: right;

  &.up { color: #37ffb1; }
  &.down { color: #ff8a7a; }
}

.ranking-formula {
  flex-shrink: 0;
  margin: 0;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 10px;
  line-height: 1.45;
  color: rgba(174, 198, 230, 0.68);
  background: rgba(0, 60, 120, 0.15);
  border: 1px solid rgba(0, 212, 255, 0.1);
}
</style>
