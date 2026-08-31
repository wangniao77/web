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
    <section class="pillar-dive__block">
      <header class="pillar-dive__head">
        <p>总览</p>
        <h2>{{ pillar.label }}</h2>
      </header>
      <dl class="pillar-dive__metrics">
        <div v-for="metric in pillar.metrics" :key="metric.label" class="pillar-dive__metric">
          <dt>{{ metric.label }}</dt>
          <dd>{{ metric.value }}<small v-if="metric.unit">{{ metric.unit }}</small></dd>
        </div>
      </dl>
      <div class="pillar-dive__swot">
        <article class="pillar-dive__note pillar-dive__note--good">
          <h3>优势</h3>
          <ol v-if="pillar.strengths.length">
            <li v-for="item in pillar.strengths" :key="item">{{ item }}</li>
          </ol>
          <p v-else class="pillar-dive__empty">暂无足够数据研判优势</p>
        </article>
        <article class="pillar-dive__note pillar-dive__note--weak">
          <h3>劣势</h3>
          <ol v-if="pillar.weaknesses.length">
            <li v-for="item in pillar.weaknesses" :key="item">{{ item }}</li>
          </ol>
          <p v-else class="pillar-dive__empty">暂无突出短板</p>
        </article>
      </div>
    </section>

    <section class="pillar-dive__block">
      <header class="pillar-dive__head">
        <p>研判依据</p>
        <h2>采用原因分析</h2>
      </header>
      <p class="pillar-dive__lead">解释当前优势与短板为何形成，作为建议动作与后续规划的依据。</p>
      <div class="pillar-dive__reasons">
        <article
          v-for="(reason, index) in pillar.adoptionReasons"
          :key="reason"
        >
          <h3>{{ index === 0 ? '优势何以形成' : '短板从何而来' }}</h3>
          <p>{{ reason }}</p>
        </article>
      </div>
    </section>

    <section class="pillar-dive__block">
      <div class="pillar-dive__split">
        <article>
          <h3>建议动作</h3>
          <ol>
            <li v-for="item in pillar.actions" :key="item">{{ item }}</li>
          </ol>
        </article>
        <article>
          <h3>后续规划</h3>
          <ol>
            <li v-for="item in pillar.nextPlans" :key="item">{{ item }}</li>
          </ol>
        </article>
      </div>
    </section>

    <section class="pillar-dive__block">
      <header class="pillar-dive__head">
        <p>证据</p>
        <h2>本板块成果清单</h2>
        <em>{{ evidence.length }} 项</em>
      </header>
      <div class="pillar-dive__list">
        <article v-for="item in evidence" :key="item.id">
          <div>
            <strong>{{ item.title }}</strong>
            <span>{{ [item.categoryLabel, item.level, item.source].filter(Boolean).join(' · ') }}</span>
          </div>
          <aside>
            <time>{{ item.date || '—' }}</time>
            <b>{{ item.leader || '—' }}</b>
          </aside>
        </article>
        <p v-if="!evidence.length" class="pillar-dive__empty pillar-dive__empty--box">该板块暂无成果明细</p>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.pillar-dive {
  --ink: #e8f4fc;
  --mute: #8fb4cc;
  --line: rgba(160, 214, 236, 0.16);
  --accent: #7ad8ee;
  min-height: 0;
}

.pillar-dive__block {
  margin-bottom: 28px;
  padding: 6px 2px 22px;
  border-bottom: 1px solid var(--line);

  &:last-child {
    margin-bottom: 0;
    border-bottom: none;
  }
}

.pillar-dive__head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-bottom: 16px;

  p {
    margin: 0;
    color: var(--mute);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.24em;
  }

  h2 {
    margin: 0;
    color: var(--ink);
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  em {
    margin-left: auto;
    color: var(--mute);
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
}

.pillar-dive__lead {
  margin: -6px 0 16px;
  max-width: 42em;
  color: var(--mute);
  font-size: 16px;
  line-height: 1.7;
  text-wrap: pretty;
}

.pillar-dive__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin: 0 0 22px;
}

.pillar-dive__metric {
  flex: 1 1 168px;
  min-width: 0;
  padding: 4px 22px 4px 0;

  + .pillar-dive__metric {
    padding-left: 22px;
    box-shadow: inset 1px 0 0 var(--line);
  }

  dt {
    color: var(--mute);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
  }

  dd {
    margin: 6px 0 0;
    color: var(--accent);
    font-family: 'Bahnschrift', 'DIN Alternate', ui-monospace, sans-serif;
    font-size: 32px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;

    small {
      margin-left: 4px;
      color: var(--mute);
      font-size: 14px;
      font-weight: 500;
    }
  }
}

.pillar-dive__swot,
.pillar-dive__reasons,
.pillar-dive__split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
}

.pillar-dive__note,
.pillar-dive__reasons article,
.pillar-dive__split article {
  min-width: 0;
  padding: 0 0 0 14px;
  border: none;
  background: transparent;
  box-shadow: inset 2px 0 0 var(--line);

  h3 {
    margin: 0 0 10px;
    color: var(--ink);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  p,
  li {
    color: #c9dcec;
    font-size: 16px;
    line-height: 1.7;
  }

  p { margin: 0; }

  ol {
    margin: 0;
    padding-left: 18px;
  }

  li + li { margin-top: 8px; }
}

.pillar-dive__note--good { box-shadow: inset 2px 0 0 #7ad8ee; }
.pillar-dive__note--weak { box-shadow: inset 2px 0 0 #e6c27a; }

.pillar-dive__empty {
  margin: 0;
  color: rgba(143, 180, 204, 0.7);
  font-size: 16px;

  &--box {
    padding: 28px 8px;
    text-align: center;
    border-top: 1px dashed var(--line);
    border-bottom: 1px dashed var(--line);
  }
}

.pillar-dive__list {
  display: flex;
  flex-direction: column;

  article {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
    padding: 14px 0;
    border-top: 1px solid var(--line);

    &:last-child { border-bottom: 1px solid var(--line); }

    strong {
      display: block;
      color: var(--ink);
      font-size: 17px;
      font-weight: 600;
    }

    span {
      display: block;
      margin-top: 4px;
      color: var(--mute);
      font-size: 13px;
    }

    aside {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      flex-shrink: 0;
      color: var(--mute);
      font-size: 13px;

      time { font-variant-numeric: tabular-nums; }
      b { color: #c9dcec; font-weight: 600; }
    }
  }
}

@media (max-width: 1100px) {
  .pillar-dive__swot,
  .pillar-dive__reasons,
  .pillar-dive__split {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}
</style>
