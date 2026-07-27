<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { analyzePage } from '@/api/agent/services'
import { useScope } from '@/composables/useScope'
import type { AgentAnalysisVM } from '@/types/agent/view'

const props = defineProps<{
  /** 可选：页面已有摘要，减少二次拉数；为空则后端自行构快照 */
  snapshot?: Record<string, unknown> | null
  /** 进入区块时是否自动分析 */
  auto?: boolean
}>()

const { collegeScope } = useScope()
const report = ref<AgentAnalysisVM | null>(null)
const loading = ref(false)
const analyzing = ref(false)
const error = ref<string | null>(null)
const expanded = ref(false)

const headline = computed(
  () =>
    report.value?.headline ||
    (report.value?.insights?.[0]
      ? `${report.value.insights[0].title}：${report.value.insights[0].detail}`
      : '点击「生成分析」，基于研究生主档 / 科研 / 就业聚合产出可核对洞察。'),
)

const insights = computed(() => (report.value?.insights || []).slice(0, 3))
const actions = computed(() => report.value?.actions || [])
const sourceLabel = computed(() => {
  const s = report.value?.source
  if (s === 'agent') return 'Agent'
  if (s === 'rule') return '规则引擎'
  if (s === 'mock') return 'Mock'
  return s || '未生成'
})

async function runAnalysis(refresh = true) {
  analyzing.value = true
  loading.value = true
  error.value = null
  try {
    report.value = await analyzePage({
      context: {
        scope: 'college',
        page: 'graduate-cultivation',
        collegeId: collegeScope.value.collegeId,
        summarySnapshot: props.snapshot || undefined,
      },
      sessionId: refresh ? undefined : report.value?.sessionId,
      refresh,
    })
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '分析失败'
  } finally {
    analyzing.value = false
    loading.value = false
  }
}

onMounted(() => {
  if (props.auto !== false) void runAnalysis(false)
})
</script>

<template>
  <section class="grad-ai">
    <div class="grad-ai__head">
      <div>
        <h3>AI 分析 · 研究生培养</h3>
        <p class="grad-ai__desc">
          来源 <em>{{ sourceLabel }}</em>
          <span v-if="report?.degraded" class="grad-ai__degrade">（已降级）</span>
        </p>
      </div>
      <div class="grad-ai__actions">
        <button
          type="button"
          class="grad-ai__btn"
          :disabled="analyzing || loading"
          @click="runAnalysis(true)"
        >
          {{ analyzing ? '分析中…' : report ? '重新分析' : '生成分析' }}
        </button>
        <button
          type="button"
          class="grad-ai__btn grad-ai__btn--ghost"
          :disabled="!report"
          @click="expanded = !expanded"
        >
          {{ expanded ? '收起详情' : '展开详情' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="grad-ai__error">{{ error }}</p>
    <p v-else-if="loading && !report" class="grad-ai__loading">正在生成研究生培养分析…</p>
    <p v-else class="grad-ai__headline">{{ headline }}</p>

    <div v-if="insights.length" class="grad-ai__grid">
      <article
        v-for="item in insights"
        :key="item.title"
        class="grad-ai__card"
        :class="`grad-ai__card--${item.tone || 'info'}`"
      >
        <h4>{{ item.title }}</h4>
        <p>{{ item.detail }}</p>
        <ul v-if="expanded && item.evidence?.length" class="grad-ai__evidence">
          <li v-for="(ev, idx) in item.evidence" :key="`${ev.label}-${idx}`">
            <b>{{ ev.source === 'db' ? '库表' : ev.source }}</b>
            {{ ev.label }}：{{ ev.value }}
          </li>
        </ul>
      </article>
    </div>

    <div v-if="expanded && actions.length" class="grad-ai__suggest">
      <h4>建议动作</h4>
      <ol>
        <li v-for="(action, idx) in actions" :key="idx">{{ action }}</li>
      </ol>
    </div>
  </section>
</template>

<style scoped lang="scss">
.grad-ai {
  margin-top: 14px;
  padding: 14px 16px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.22);
  background: linear-gradient(180deg, rgba(0, 50, 100, 0.35), rgba(0, 30, 70, 0.28));
}

.grad-ai__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
    color: #eaf7ff;
  }
}

.grad-ai__desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: #8ec8e8;

  em {
    font-style: normal;
    color: #9fe8ff;
    font-weight: 700;
  }
}

.grad-ai__degrade {
  color: #ffc19a;
}

.grad-ai__actions {
  display: flex;
  gap: 8px;
}

.grad-ai__btn {
  min-height: 34px;
  padding: 4px 14px;
  border-radius: 6px;
  border: 1px solid rgba(0, 220, 255, 0.45);
  background: rgba(0, 140, 220, 0.35);
  color: #eaf7ff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(0, 160, 240, 0.45);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.grad-ai__btn--ghost {
  background: transparent;
  border-color: rgba(0, 200, 255, 0.28);
  color: #9fe8ff;
}

.grad-ai__headline {
  margin: 0 0 12px;
  font-size: 15px;
  line-height: 1.55;
  color: #c8e6ff;
}

.grad-ai__error {
  margin: 0 0 10px;
  color: #ff9b9b;
  font-size: 14px;
}

.grad-ai__loading {
  margin: 0 0 10px;
  color: #8ec8e8;
  font-size: 14px;
}

.grad-ai__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 1100px) {
  .grad-ai__grid {
    grid-template-columns: 1fr;
  }
}

.grad-ai__card {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 180, 255, 0.18);
  background: rgba(0, 40, 90, 0.35);

  h4 {
    margin: 0 0 6px;
    font-size: 15px;
    font-weight: 800;
    color: #eaf7ff;
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: #b7d7ef;
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

.grad-ai__evidence {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;

  li {
    font-size: 12px;
    color: #8ec8e8;
    margin-top: 4px;

    b {
      color: #7fe9ff;
      margin-right: 4px;
    }
  }
}

.grad-ai__suggest {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 180, 255, 0.15);

  h4 {
    margin: 0 0 8px;
    font-size: 14px;
    color: #9fe8ff;
  }

  ol {
    margin: 0;
    padding-left: 18px;
    color: #c8e6ff;
    font-size: 13px;
    line-height: 1.6;
  }
}
</style>
