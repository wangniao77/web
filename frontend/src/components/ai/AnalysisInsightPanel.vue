<script setup lang="ts">
import type { AgentAnalysisVM } from '@/types/agent/view'

defineProps<{
  data: AgentAnalysisVM | null
  loading?: boolean
  error?: string | null
}>()

defineEmits<{
  refresh: []
  retry: []
}>()
</script>

<template>
  <section class="analysis-insight">
    <header class="analysis-insight__head">
      <div>
        <h2 class="analysis-insight__title">
          <span class="analysis-insight__title-icon">🔍</span>
          深度挖掘 · Agent 分析
        </h2>
        <p class="analysis-insight__desc">
          结构结论与可执行建议；支持刷新重算。来源：
          <em>{{ data?.source || '—' }}</em>
          <span v-if="data?.degraded" class="analysis-insight__badge">已降级</span>
        </p>
      </div>
      <button
        type="button"
        class="analysis-insight__refresh"
        :disabled="loading"
        @click="$emit('refresh')"
      >
        {{ loading ? '分析中…' : '刷新分析' }}
      </button>
    </header>

    <p v-if="data?.degradeReason" class="analysis-insight__warn">{{ data.degradeReason }}</p>
    <div v-if="loading && !data" class="analysis-insight__placeholder">正在生成洞察…</div>
    <div v-else-if="error && !data" class="analysis-insight__placeholder analysis-insight__placeholder--error">
      {{ error }}
      <button type="button" class="analysis-insight__retry" @click="$emit('retry')">重试</button>
    </div>
    <template v-else-if="data">
      <div class="insight-grid">
        <article
          v-for="item in data.insights"
          :key="item.title"
          class="insight-card"
          :class="`insight-card--${item.tone}`"
        >
          <h4>{{ item.title }}</h4>
          <p>{{ item.detail }}</p>
        </article>
      </div>

      <div class="action-card">
        <h3>建议动作</h3>
        <ol class="action-list">
          <li v-for="(action, idx) in data.actions" :key="idx">{{ action }}</li>
        </ol>
      </div>
    </template>
  </section>
</template>

<style scoped lang="scss">
.analysis-insight {
  display: grid;
  gap: 14px;
}

.analysis-insight__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.analysis-insight__title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 22px;
  color: #e8f7ff;
}

.analysis-insight__title-icon {
  font-style: normal;
}

.analysis-insight__desc {
  margin: 6px 0 0;
  color: rgba(184, 236, 255, 0.72);
  font-size: 15px;

  em {
    font-style: normal;
    color: #7dd3fc;
  }
}

.analysis-insight__badge {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(251, 191, 36, 0.18);
  color: #fbbf24;
  font-size: 12px;
}

.analysis-insight__refresh,
.analysis-insight__retry {
  border: 1px solid rgba(0, 242, 255, 0.35);
  background: rgba(0, 80, 120, 0.35);
  color: #e8f7ff;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    border-color: rgba(0, 242, 255, 0.7);
  }
}

.analysis-insight__warn {
  margin: 0;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(251, 191, 36, 0.1);
  color: #fcd34d;
  font-size: 14px;
}

.analysis-insight__placeholder {
  min-height: 120px;
  display: grid;
  place-items: center;
  gap: 10px;
  color: rgba(184, 236, 255, 0.72);
  font-size: 18px;

  &--error {
    color: #fca5a5;
  }
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.insight-card {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 242, 255, 0.18);
  background: rgba(4, 28, 58, 0.55);

  h4 {
    margin: 0 0 8px;
    font-size: 17px;
    color: #f0fbff;
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.55;
    color: rgba(200, 232, 255, 0.82);
  }

  &--good {
    border-color: rgba(52, 211, 153, 0.35);
  }

  &--warn {
    border-color: rgba(251, 191, 36, 0.4);
  }

  &--info {
    border-color: rgba(56, 189, 248, 0.35);
  }
}

.action-card {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 242, 255, 0.18);
  background: rgba(4, 28, 58, 0.55);

  h3 {
    margin: 0 0 10px;
    font-size: 17px;
    color: #f0fbff;
  }
}

.action-list {
  margin: 0;
  padding-left: 20px;
  color: rgba(200, 232, 255, 0.85);
  font-size: 14px;
  line-height: 1.7;
}

@media (max-width: 1100px) {
  .insight-grid {
    grid-template-columns: 1fr;
  }
}
</style>
