<script setup lang="ts">
import { computed } from 'vue'
import type { AgentAnalysisVM, AgentInsightVM } from '@/types/agent/view'
import type { DisciplineOverviewSnapshot } from '@/utils/agent/discipline-overview-insights'

const props = defineProps<{
  data: AgentAnalysisVM | null
  snapshot?: DisciplineOverviewSnapshot | null
  loading?: boolean
  error?: string | null
}>()

defineEmits<{
  refresh: []
  retry: []
}>()

const TONE: Record<string, { label: string; mark: string }> = {
  good: { label: '支点', mark: '◆' },
  warn: { label: '风险', mark: '▲' },
  info: { label: '研判', mark: '■' },
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function shortMajor(name: string) {
  if (name.includes('计算机')) return '计科'
  if (name.includes('软件')) return '软工'
  if (name.includes('人工')) return '人工智能'
  return name
}

function yoyText(v: unknown) {
  if (!isNum(v)) return '**'
  if (v > 0) return `↑${v}`
  if (v < 0) return `↓${Math.abs(v)}`
  return '持平'
}

const sourceLabel = computed(() => {
  const s = props.data?.source
  if (s === 'agent') return 'AI Agent'
  if (s === 'rule') return '规则引擎'
  if (s === 'mock') return 'Mock'
  return s || '待生成'
})

const facts = computed(() => {
  const snap = props.snapshot
  const out: Array<{ label: string; value: string; hint?: string }> = []
  if (!snap) return out
  const ranked = snap.majors.filter((m) => isNum(m.nationalRank))
  const best = [...ranked].sort((a, b) => Number(a.nationalRank) - Number(b.nationalRank))[0]
  const worst = [...ranked].sort((a, b) => Number(b.nationalRank) - Number(a.nationalRank))[0]
  if (isNum(snap.ranking.current)) {
    out.push({
      label: '学院中位',
      value: `第${snap.ranking.current}`,
      hint: isNum(snap.ranking.yoyChange)
        ? `较上年 ${yoyText(snap.ranking.yoyChange)}`
        : '软科全国中位数',
    })
  }
  if (best) {
    out.push({
      label: '领跑',
      value: `${shortMajor(best.name)} ${best.nationalRank}`,
      hint: `${best.grade === '**' ? '等级缺源' : `${best.grade}级`} · ${yoyText(best.yoyChange)}`,
    })
  }
  if (worst && best && worst.name !== best.name) {
    out.push({
      label: '待提升',
      value: `${shortMajor(worst.name)} ${worst.nationalRank}`,
      hint: `${yoyText(worst.yoyChange)} · 与领跑差 ${Number(worst.nationalRank) - Number(best.nationalRank)} 位`,
    })
  }
  const emp = [...snap.majors]
    .filter((m) => isNum(m.employmentRate))
    .sort((a, b) => Number(b.employmentRate) - Number(a.employmentRate))[0]
  if (emp) {
    out.push({
      label: '出口最高',
      value: `${emp.employmentRate}%`,
      hint: `${shortMajor(emp.name)} 去向落实率`,
    })
  }
  const falling = snap.majors.filter((m) => isNum(m.yoyChange) && m.yoyChange < 0)
  if (falling.length) {
    out.push({
      label: '回落',
      value: `${falling.length} 个专业`,
      hint: falling.map((m) => `${shortMajor(m.name)}${yoyText(m.yoyChange)}`).join(' · '),
    })
  }
  return out.slice(0, 5)
})

const lead = computed(() => props.data?.insights?.[0] ?? null)
const sides = computed(() => (props.data?.insights ?? []).slice(1, 3))
const actions = computed(() => (props.data?.actions ?? []).slice(0, 3))

function toneMeta(item: AgentInsightVM) {
  return TONE[item.tone || 'info'] || TONE.info
}

function evidenceOf(item: AgentInsightVM) {
  return (item.evidence || []).slice(0, 4)
}
</script>

<template>
  <section class="ai-brief">
    <header class="ai-brief__head">
      <div class="ai-brief__brand">
        <span class="ai-brief__kicker">STRATEGIC BRIEF</span>
        <h2>AI 研判</h2>
        <p>依据专业排名、涨跌与办学指标，给出可核对的矩阵判断</p>
      </div>
      <div class="ai-brief__meta">
        <span class="ai-brief__source">{{ sourceLabel }}</span>
        <span v-if="data?.degraded" class="ai-brief__badge">已降级</span>
        <button type="button" class="ai-brief__refresh" :disabled="loading" @click="$emit('refresh')">
          {{ loading ? '研判中…' : '刷新研判' }}
        </button>
      </div>
    </header>

    <p v-if="data?.degradeReason" class="ai-brief__warn">{{ data.degradeReason }}</p>
    <div v-if="loading && !data" class="ai-brief__placeholder">正在汇总统判断与依据…</div>
    <div v-else-if="error && !data" class="ai-brief__placeholder ai-brief__placeholder--error">
      {{ error }}
      <button type="button" class="ai-brief__refresh" @click="$emit('retry')">重试</button>
    </div>

    <template v-else-if="data">
      <div class="ai-brief__verdict">
        <em>总判断</em>
        <p>{{ data.headline || lead?.detail || '排名与指标待齐后再作研判。' }}</p>
      </div>

      <div v-if="facts.length" class="ai-brief__facts">
        <span class="ai-brief__facts-label">依据</span>
        <div class="ai-brief__fact-row">
          <article v-for="fact in facts" :key="fact.label" class="ai-brief__fact">
            <span>{{ fact.label }}</span>
            <strong>{{ fact.value }}</strong>
            <small v-if="fact.hint">{{ fact.hint }}</small>
          </article>
        </div>
      </div>

      <div class="ai-brief__body">
        <article v-if="lead" class="ai-brief__lead" :class="`is-${lead.tone || 'info'}`">
          <div class="ai-brief__lead-top">
            <span class="ai-brief__idx">01</span>
            <span class="ai-brief__tone">{{ toneMeta(lead).mark }} {{ toneMeta(lead).label }}</span>
          </div>
          <h3>{{ lead.title }}</h3>
          <p>{{ lead.detail }}</p>
          <ul v-if="evidenceOf(lead).length" class="ai-brief__evidence">
            <li v-for="(ev, idx) in evidenceOf(lead)" :key="`${ev.label}-${idx}`">
              <b>{{ ev.label }}</b>
              <em>{{ ev.value }}</em>
            </li>
          </ul>
        </article>

        <div class="ai-brief__sides">
          <article
            v-for="(item, idx) in sides"
            :key="item.title"
            class="ai-brief__side"
            :class="`is-${item.tone || 'info'}`"
          >
            <div class="ai-brief__lead-top">
              <span class="ai-brief__idx">{{ String(idx + 2).padStart(2, '0') }}</span>
              <span class="ai-brief__tone">{{ toneMeta(item).mark }} {{ toneMeta(item).label }}</span>
            </div>
            <h4>{{ item.title }}</h4>
            <p>{{ item.detail }}</p>
            <ul v-if="evidenceOf(item).length" class="ai-brief__evidence ai-brief__evidence--compact">
              <li v-for="(ev, eidx) in evidenceOf(item)" :key="`${item.title}-${eidx}`">
                <b>{{ ev.label }}</b>
                <em>{{ ev.value }}</em>
              </li>
            </ul>
          </article>
        </div>
      </div>

      <div v-if="actions.length" class="ai-brief__moves">
        <span class="ai-brief__facts-label">建议动作</span>
        <ol>
          <li v-for="(action, idx) in actions" :key="idx">
            <i>{{ String(idx + 1).padStart(2, '0') }}</i>
            <p>{{ action }}</p>
          </li>
        </ol>
      </div>
    </template>
  </section>
</template>

<style scoped lang="scss">
.ai-brief {
  position: relative;
  overflow: hidden;
  margin-bottom: 22px;
  padding: 22px 24px 24px;
  border-radius: 14px;
  border: 1px solid rgba(0, 220, 255, 0.28);
  background:
    radial-gradient(90% 80% at 0% 0%, rgba(0, 170, 255, 0.2), transparent 52%),
    radial-gradient(70% 70% at 100% 0%, rgba(255, 196, 80, 0.08), transparent 46%),
    linear-gradient(165deg, rgba(4, 32, 72, 0.88), rgba(2, 12, 36, 0.72));
  box-shadow:
    inset 0 1px 0 rgba(160, 230, 255, 0.16),
    0 18px 40px rgba(0, 8, 24, 0.35);

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: linear-gradient(180deg, #5cecff, #ffd56a 55%, transparent);
  }
}

.ai-brief__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.ai-brief__kicker {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.22em;
  color: rgba(92, 236, 255, 0.72);
}

.ai-brief__brand h2 {
  margin: 0;
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: #f4fbff;
  text-shadow: 0 0 22px rgba(0, 210, 255, 0.28);
}

.ai-brief__brand p {
  margin: 6px 0 0;
  font-size: 16px;
  color: #8ec8e8;
}

.ai-brief__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.ai-brief__source,
.ai-brief__badge {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 800;
}

.ai-brief__source {
  border: 1px solid rgba(80, 220, 255, 0.45);
  background: rgba(0, 140, 210, 0.28);
  color: #9fe8ff;
}

.ai-brief__badge {
  border: 1px solid rgba(251, 191, 36, 0.4);
  background: rgba(120, 80, 10, 0.35);
  color: #ffd89a;
}

.ai-brief__refresh {
  min-height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 220, 255, 0.5);
  background: rgba(0, 140, 220, 0.38);
  color: #eaf7ff;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;

  &:hover:not(:disabled) { background: rgba(0, 170, 245, 0.5); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.ai-brief__verdict {
  margin-bottom: 16px;
  padding: 16px 18px 18px;
  border-radius: 12px;
  border: 1px solid rgba(255, 213, 106, 0.22);
  background: linear-gradient(100deg, rgba(80, 50, 8, 0.28), rgba(0, 40, 90, 0.2));

  em {
    display: block;
    margin-bottom: 8px;
    font-style: normal;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.16em;
    color: #ffd56a;
  }

  p {
    margin: 0;
    font-size: 26px;
    font-weight: 800;
    line-height: 1.45;
    color: #f7fbff;
  }
}

.ai-brief__facts {
  margin-bottom: 16px;
}

.ai-brief__facts-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: #7fdfff;
}

.ai-brief__fact-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.ai-brief__fact {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 88px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.16);
  background: rgba(2, 16, 42, 0.45);

  span {
    font-size: 13px;
    font-weight: 700;
    color: #8ec8e8;
  }

  strong {
    font-size: 24px;
    font-weight: 900;
    color: #5cecff;
    line-height: 1.15;
  }

  small {
    font-size: 13px;
    line-height: 1.4;
    color: #9fb6d2;
  }
}

.ai-brief__body {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 14px;
  margin-bottom: 16px;
}

.ai-brief__lead,
.ai-brief__side {
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid rgba(0, 200, 255, 0.16);
  background: rgba(2, 18, 48, 0.4);

  &.is-good { border-color: rgba(110, 255, 194, 0.28); }
  &.is-warn { border-color: rgba(255, 170, 60, 0.32); }
  &.is-info { border-color: rgba(92, 236, 255, 0.24); }
}

.ai-brief__lead {
  min-height: 100%;
  background:
    linear-gradient(180deg, rgba(0, 90, 160, 0.22), transparent 42%),
    rgba(2, 18, 48, 0.45);

  h3 {
    margin: 0 0 10px;
    font-size: 22px;
    color: #eaf7ff;
  }

  p {
    margin: 0;
    font-size: 17px;
    line-height: 1.7;
    color: #d7ecff;
  }
}

.ai-brief__sides {
  display: grid;
  gap: 12px;
}

.ai-brief__side {
  h4 {
    margin: 0 0 8px;
    font-size: 18px;
    color: #eaf7ff;
  }

  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.65;
    color: #c6dcf0;
  }
}

.ai-brief__lead-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.ai-brief__idx {
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: rgba(92, 236, 255, 0.7);
}

.ai-brief__tone {
  font-size: 13px;
  font-weight: 800;
  color: #ffd56a;
}

.ai-brief__evidence {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;

  li {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(0, 80, 140, 0.35);
    border: 1px solid rgba(0, 200, 255, 0.18);
  }

  b {
    font-size: 12px;
    font-weight: 700;
    color: #8ec8e8;
  }

  em {
    font-style: normal;
    font-size: 14px;
    font-weight: 800;
    color: #eaf7ff;
  }

  &--compact { margin-top: 10px; }
}

.ai-brief__moves {
  ol {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
    align-items: start;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid rgba(255, 213, 106, 0.18);
    background: rgba(40, 28, 4, 0.28);
  }

  i {
    font-style: normal;
    font-size: 15px;
    font-weight: 900;
    color: #ffd56a;
  }

  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.55;
    color: #eaf7ff;
  }
}

.ai-brief__warn {
  margin: 0 0 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(251, 191, 36, 0.1);
  color: #fcd34d;
}

.ai-brief__placeholder {
  min-height: 140px;
  display: grid;
  place-items: center;
  gap: 10px;
  color: rgba(184, 236, 255, 0.72);
  font-size: 18px;

  &--error { color: #fca5a5; }
}

@media (max-width: 1280px) {
  .ai-brief__fact-row,
  .ai-brief__body,
  .ai-brief__moves ol {
    grid-template-columns: 1fr;
  }

  .ai-brief__verdict p { font-size: 22px; }
}
</style>
