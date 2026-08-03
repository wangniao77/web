<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { analyzePage } from '@/api/agent/services'
import { useScope } from '@/composables/useScope'
import type { AgentAnalysisVM, AgentInsightVM } from '@/types/agent/view'

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

const TONE_META: Record<string, { label: string; icon: string }> = {
  good: { label: '良好', icon: '✓' },
  warn: { label: '关注', icon: '!' },
  info: { label: '提示', icon: 'i' },
}

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
  if (s === 'agent') return 'AI Agent'
  if (s === 'rule') return '规则引擎'
  if (s === 'mock') return 'Mock'
  return s || '未生成'
})

function toneMeta(tone?: string) {
  return TONE_META[tone || 'info'] || TONE_META.info
}

function evidenceChips(item: AgentInsightVM) {
  return (item.evidence || []).slice(0, 3)
}

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
      <div class="grad-ai__title-wrap">
        <div class="grad-ai__title-row">
          <h3>AI 分析 · 研究生培养</h3>
          <span class="grad-ai__source">{{ sourceLabel }}</span>
          <span v-if="report?.degraded" class="grad-ai__degrade">已降级</span>
        </div>
        <p class="grad-ai__desc">基于主档规模、专业结构、导师覆盖、科研参与与就业出口的可核对洞察</p>
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
    <div v-else class="grad-ai__headline">
      <span class="grad-ai__headline-mark" aria-hidden="true">◆</span>
      <p>{{ headline }}</p>
    </div>

    <div v-if="insights.length" class="grad-ai__grid">
      <article
        v-for="(item, idx) in insights"
        :key="item.title"
        class="grad-ai__card"
        :class="`grad-ai__card--${item.tone || 'info'}`"
      >
        <div class="grad-ai__card-top">
          <span class="grad-ai__index">{{ String(idx + 1).padStart(2, '0') }}</span>
          <span class="grad-ai__tone">
            <i>{{ toneMeta(item.tone).icon }}</i>
            {{ toneMeta(item.tone).label }}
          </span>
        </div>
        <h4>{{ item.title }}</h4>
        <div v-if="evidenceChips(item).length" class="grad-ai__metrics">
          <span
            v-for="(ev, eidx) in evidenceChips(item)"
            :key="`${ev.label}-${eidx}`"
            class="grad-ai__metric"
          >
            <em>{{ ev.label }}</em>
            <strong>{{ ev.value }}</strong>
          </span>
        </div>
        <p>{{ item.detail }}</p>
        <ul v-if="expanded && item.evidence?.length" class="grad-ai__evidence">
          <li v-for="(ev, eidx) in item.evidence" :key="`full-${ev.label}-${eidx}`">
            <b>{{ ev.source === 'db' ? '库表' : ev.source }}</b>
            {{ ev.label }}：{{ ev.value }}
            <span v-if="ev.ref" class="grad-ai__ref">（{{ ev.ref }}）</span>
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
  margin-top: 16px;
  padding: 18px 20px 20px;
  border-radius: 12px;
  border: 1px solid rgba(0, 210, 255, 0.28);
  background:
    radial-gradient(120% 80% at 0% 0%, rgba(0, 160, 255, 0.16), transparent 55%),
    linear-gradient(165deg, rgba(4, 36, 78, 0.72), rgba(2, 18, 42, 0.55));
  box-shadow: inset 0 1px 0 rgba(140, 230, 255, 0.12);
}

.grad-ai__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.grad-ai__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.grad-ai__title-wrap h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #eaf7ff;
  text-shadow: 0 0 18px rgba(0, 200, 255, 0.28);
}

.grad-ai__source {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(80, 220, 255, 0.45);
  background: rgba(0, 150, 220, 0.28);
  color: #9fe8ff;
  font-size: 14px;
  font-weight: 700;
}

.grad-ai__degrade {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(251, 191, 36, 0.4);
  background: rgba(120, 80, 10, 0.35);
  color: #ffd89a;
  font-size: 14px;
  font-weight: 700;
}

.grad-ai__desc {
  margin: 8px 0 0;
  font-size: 16px;
  line-height: 1.5;
  color: #8ec8e8;
}

.grad-ai__actions {
  display: flex;
  gap: 10px;
}

.grad-ai__btn {
  min-height: 40px;
  padding: 6px 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 220, 255, 0.5);
  background: rgba(0, 140, 220, 0.4);
  color: #eaf7ff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(0, 170, 245, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.grad-ai__btn--ghost {
  background: transparent;
  border-color: rgba(0, 200, 255, 0.3);
  color: #9fe8ff;
}

.grad-ai__headline {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 0 0 16px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 210, 255, 0.28);
  background: linear-gradient(90deg, rgba(0, 90, 160, 0.35), rgba(0, 40, 90, 0.22));

  p {
    margin: 0;
    font-size: 18px;
    line-height: 1.6;
    font-weight: 600;
    color: #dff4ff;
  }
}

.grad-ai__headline-mark {
  flex: 0 0 auto;
  margin-top: 2px;
  color: #5ff4ff;
  font-size: 16px;
  text-shadow: 0 0 12px rgba(0, 229, 255, 0.7);
}

.grad-ai__error {
  margin: 0 0 12px;
  color: #ff9b9b;
  font-size: 16px;
}

.grad-ai__loading {
  margin: 0 0 12px;
  color: #8ec8e8;
  font-size: 16px;
}

.grad-ai__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 1200px) {
  .grad-ai__grid {
    grid-template-columns: 1fr;
  }
}

.grad-ai__card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 220px;
  padding: 16px 16px 18px;
  border-radius: 12px;
  border: 1px solid rgba(0, 180, 255, 0.22);
  background: rgba(0, 28, 68, 0.45);
  box-shadow: inset 3px 0 0 rgba(56, 189, 248, 0.7);

  h4 {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.35;
    color: #eaf7ff;
  }

  > p {
    margin: 0;
    flex: 1;
    font-size: 16px;
    line-height: 1.65;
    color: #c5e5fb;
  }

  &--good {
    border-color: rgba(52, 211, 153, 0.35);
    background: rgba(8, 48, 42, 0.42);
    box-shadow: inset 3px 0 0 rgba(52, 211, 153, 0.85);

    .grad-ai__tone {
      border-color: rgba(52, 211, 153, 0.45);
      background: rgba(16, 100, 70, 0.35);
      color: #9af5c8;
    }
  }

  &--warn {
    border-color: rgba(251, 191, 36, 0.42);
    background: rgba(58, 40, 12, 0.38);
    box-shadow: inset 3px 0 0 rgba(251, 191, 36, 0.9);

    .grad-ai__tone {
      border-color: rgba(251, 191, 36, 0.45);
      background: rgba(120, 80, 10, 0.35);
      color: #ffe0a0;
    }
  }

  &--info {
    .grad-ai__tone {
      border-color: rgba(56, 189, 248, 0.4);
      background: rgba(0, 90, 150, 0.35);
      color: #9fe8ff;
    }
  }
}

.grad-ai__card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.grad-ai__index {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: rgba(120, 210, 255, 0.7);
  font-variant-numeric: tabular-nums;
}

.grad-ai__tone {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 700;

  i {
    display: inline-grid;
    place-items: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid currentColor;
    font-style: normal;
    font-size: 11px;
    line-height: 1;
  }
}

.grad-ai__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.grad-ai__metric {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  min-width: 96px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.2);
  background: rgba(0, 20, 50, 0.45);

  em {
    font-style: normal;
    font-size: 13px;
    color: #7eb8d8;
  }

  strong {
    font-size: 18px;
    font-weight: 800;
    color: #7fe9ff;
    line-height: 1.2;
  }
}

.grad-ai__evidence {
  margin: 2px 0 0;
  padding: 10px 12px;
  list-style: none;
  border-radius: 8px;
  background: rgba(0, 16, 40, 0.4);
  border: 1px dashed rgba(0, 180, 255, 0.22);

  li {
    font-size: 14px;
    line-height: 1.55;
    color: #9ecae8;

    + li {
      margin-top: 6px;
    }

    b {
      color: #7fe9ff;
      margin-right: 4px;
    }
  }
}

.grad-ai__ref {
  color: #7aa8c4;
}

.grad-ai__suggest {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px dashed rgba(0, 200, 255, 0.3);
  background: rgba(0, 40, 90, 0.28);

  h4 {
    margin: 0 0 10px;
    font-size: 18px;
    color: #9fe8ff;
  }

  ol {
    margin: 0;
    padding-left: 22px;
    color: #d2ecff;
    font-size: 16px;
    line-height: 1.7;
  }
}
</style>
