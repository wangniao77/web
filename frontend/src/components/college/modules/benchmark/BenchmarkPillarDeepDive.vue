<script setup lang="ts">
import type {
  BenchmarkPillarEvidenceVM,
  BenchmarkPillarVM,
} from '@/types/college/view/benchmark-achievements'

defineProps<{
  pillar: BenchmarkPillarVM
  evidence: BenchmarkPillarEvidenceVM[]
}>()
</script>

<template>
  <div class="pillar-dive">
    <section class="resource-section">
      <h2 class="resource-section__title">
        <span class="resource-section__title-icon">📌</span>
        {{ pillar.label }}总览
      </h2>
      <div class="pillar-dive__metrics">
        <article v-for="metric in pillar.metrics" :key="metric.label" class="pillar-dive__metric">
          <strong>{{ metric.value }}<small v-if="metric.unit">{{ metric.unit }}</small></strong>
          <span>{{ metric.label }}</span>
        </article>
      </div>
      <div class="pillar-dive__swot">
        <div class="resource-card pillar-dive__card pillar-dive__card--good">
          <h3>优势</h3>
          <ol v-if="pillar.strengths.length" class="action-list">
            <li v-for="item in pillar.strengths" :key="item">{{ item }}</li>
          </ol>
          <p v-else class="pillar-dive__empty">暂无足够数据研判优势</p>
        </div>
        <div class="resource-card pillar-dive__card pillar-dive__card--weak">
          <h3>劣势</h3>
          <ol v-if="pillar.weaknesses.length" class="action-list">
            <li v-for="item in pillar.weaknesses" :key="item">{{ item }}</li>
          </ol>
          <p v-else class="pillar-dive__empty">暂无突出短板</p>
        </div>
      </div>
    </section>

    <section class="resource-section">
      <h2 class="resource-section__title">
        <span class="resource-section__title-icon">🔍</span>
        采用原因分析
      </h2>
      <p class="resource-section__desc">解释当前优势与短板为何形成，作为建议动作与后续规划的依据。</p>
      <div class="insight-grid">
        <article
          v-for="(reason, index) in pillar.adoptionReasons"
          :key="reason"
          class="insight-card"
          :class="index === 0 ? 'insight-card--good' : 'insight-card--info'"
        >
          <h4>{{ index === 0 ? '优势何以形成' : '短板从何而来' }}</h4>
          <p>{{ reason }}</p>
        </article>
      </div>
    </section>

    <section class="resource-section">
      <div class="resource-section__grid resource-section__grid--2">
        <div class="resource-card">
          <h3>建议动作</h3>
          <ol class="action-list">
            <li v-for="item in pillar.actions" :key="item">{{ item }}</li>
          </ol>
        </div>
        <div class="resource-card">
          <h3>后续规划</h3>
          <ol class="action-list">
            <li v-for="item in pillar.nextPlans" :key="item">{{ item }}</li>
          </ol>
        </div>
      </div>
    </section>

    <section class="resource-section">
      <h2 class="resource-section__title">
        <span class="resource-section__title-icon">🗂️</span>
        本板块成果清单
        <span class="resource-section__badge">{{ evidence.length }} 项</span>
      </h2>
      <div class="ach-list">
        <article v-for="item in evidence" :key="item.id" class="ach-item">
          <div class="ach-item__main">
            <strong>{{ item.title }}</strong>
            <span>{{ [item.categoryLabel, item.level, item.source].filter(Boolean).join(' · ') }}</span>
          </div>
          <div class="ach-item__meta">
            <em>{{ item.date || '—' }}</em>
            <b>{{ item.leader || '—' }}</b>
          </div>
        </article>
        <div v-if="!evidence.length" class="ach-empty">该板块暂无成果明细</div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.pillar-dive {
  min-height: 0;
}

.resource-section {
  margin-bottom: 22px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid rgba(0, 180, 255, 0.12);
  background: rgba(2, 18, 48, 0.35);

  &__title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 800;
    color: #eaf7ff;
  }

  &__title-icon { font-size: 24px; }

  &__badge {
    margin-left: 4px;
    padding: 3px 12px;
    border-radius: 999px;
    font-size: 16px;
    font-weight: 700;
    color: #8ef6ff;
    border: 1px solid rgba(0, 200, 255, 0.3);
    background: rgba(0, 100, 200, 0.2);
  }

  &__desc {
    margin: 0 0 16px;
    font-size: 20px;
    line-height: 1.7;
    color: #9fb6d2;
  }

  &__grid {
    display: grid;
    gap: 14px;
    &--2 { grid-template-columns: 1fr 1fr; }
  }
}

.resource-card {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.14);
  background: rgba(0, 40, 90, 0.18);

  h3 {
    margin: 0 0 12px;
    font-size: 22px;
    font-weight: 700;
    color: #b8ecff;
  }
}

.pillar-dive__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.pillar-dive__metric {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.16);
  background: linear-gradient(135deg, rgba(0, 70, 140, 0.28), rgba(2, 20, 48, 0.55));

  strong {
    display: block;
    color: #5cecff;
    font-size: 32px;
    font-weight: 900;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;

    small {
      margin-left: 4px;
      color: #7fdfff;
      font-size: 16px;
    }
  }

  span {
    display: block;
    margin-top: 6px;
    color: #8ec8e8;
    font-size: 18px;
    font-weight: 600;
  }
}

.pillar-dive__swot {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.pillar-dive__card {
  &--good { border-color: rgba(110, 255, 194, 0.28); }
  &--weak { border-color: rgba(255, 170, 60, 0.3); }
}

.pillar-dive__empty {
  margin: 0;
  color: rgba(184, 236, 255, 0.55);
  font-size: 18px;
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.insight-card {
  padding: 16px 18px;
  border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.16);
  background: rgba(0, 40, 90, 0.22);

  h4 {
    margin: 0 0 10px;
    font-size: 20px;
    font-weight: 800;
    color: #eaf7ff;
  }

  p {
    margin: 0;
    font-size: 17px;
    line-height: 1.65;
    color: #9fb6d2;
  }

  &--good { border-color: rgba(110, 255, 194, 0.28); background: rgba(20, 80, 60, 0.22); }
  &--info { border-color: rgba(92, 236, 255, 0.28); }
}

.action-list {
  margin: 0;
  padding-left: 22px;
  color: #c6dcf0;
  font-size: 18px;
  line-height: 1.7;

  li + li { margin-top: 8px; }
}

.ach-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ach-empty {
  padding: 28px 16px;
  text-align: center;
  color: rgba(184, 236, 255, 0.55);
  font-size: 18px;
  border: 1px dashed rgba(0, 200, 255, 0.2);
  border-radius: 10px;
}

.ach-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.14);
  background: rgba(0, 40, 90, 0.22);

  &__main {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;

    strong { font-size: 18px; color: #eaf7ff; }
    span { font-size: 15px; color: #8eaec8; }
  }

  &__meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;

    em { font-style: normal; font-size: 15px; color: #7fdfff; }
    b { font-size: 16px; color: #c6dcf0; font-weight: 700; }
  }
}

@media (max-width: 1100px) {
  .pillar-dive__swot,
  .insight-grid,
  .resource-section__grid--2 {
    grid-template-columns: 1fr;
  }
}
</style>
