<script setup lang="ts">
import type { EmploymentAnalysisReportVM } from '@/types/college/view/employment-analysis'

defineProps<{
  open: boolean
  report: EmploymentAnalysisReportVM | null
}>()

defineEmits<{
  close: []
}>()

function sourceLabel(source?: string) {
  if (source === 'agent') return 'Agent'
  if (source === 'rule') return '规则引擎'
  if (source === 'mock') return 'Mock'
  return source || '—'
}

function evidenceSourceLabel(source: string) {
  if (source === 'db') return '库表'
  if (source === 'openviking') return 'OpenViking'
  if (source === 'web') return '公开信源'
  return source
}

function formatTime(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('zh-CN')
  } catch {
    return iso
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="emp-report-modal" @click.self="$emit('close')">
      <div class="emp-report-modal__panel" role="dialog" aria-modal="true" aria-label="就业深度分析报告">
        <header class="emp-report-modal__head">
          <div>
            <h2>就业深度分析报告</h2>
            <p v-if="report?.headline" class="emp-report-modal__headline">{{ report.headline }}</p>
          </div>
          <button type="button" class="emp-report-modal__close" @click="$emit('close')">关闭</button>
        </header>

        <div v-if="!report" class="emp-report-modal__empty">暂无报告，请先生成分析。</div>
        <div v-else class="emp-report-modal__body">
          <section class="emp-report-modal__block">
            <h3>核心洞察</h3>
            <article
              v-for="item in report.insights"
              :key="item.title"
              class="emp-report-modal__insight"
              :class="`emp-report-modal__insight--${item.tone}`"
            >
              <h4>{{ item.title }}</h4>
              <p>{{ item.detail }}</p>
              <ul v-if="item.evidence?.length" class="emp-report-modal__evidence">
                <li v-for="(ev, idx) in item.evidence" :key="`${ev.label}-${idx}`">
                  <b>{{ evidenceSourceLabel(ev.source) }}</b>
                  <span>{{ ev.label }}：{{ ev.value }}</span>
                  <em v-if="ev.ref">{{ ev.ref }}</em>
                </li>
              </ul>
            </article>
          </section>

          <section v-if="report.sections?.length" class="emp-report-modal__block">
            <h3>分段摘要</h3>
            <div class="emp-report-modal__sections">
              <div v-for="sec in report.sections" :key="sec.title" class="emp-report-modal__section">
                <h4>{{ sec.title }}</h4>
                <ul>
                  <li v-for="(b, i) in sec.bullets" :key="i">{{ b }}</li>
                </ul>
              </div>
            </div>
          </section>

          <section class="emp-report-modal__block">
            <h3>建议动作</h3>
            <ol>
              <li v-for="(action, idx) in report.actions" :key="idx">{{ action }}</li>
            </ol>
          </section>

          <footer class="emp-report-modal__meta">
            <span>来源 {{ sourceLabel(report.source) }}</span>
            <span>生成 {{ formatTime(report.generatedAt) }}</span>
            <span v-if="report.dataFingerprint">指纹 {{ report.dataFingerprint }}</span>
          </footer>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.emp-report-modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(2, 10, 28, 0.72);
  backdrop-filter: blur(4px);
}

.emp-report-modal__panel {
  width: min(920px, 100%);
  max-height: min(86vh, 900px);
  overflow: auto;
  border-radius: 12px;
  border: 1px solid rgba(0, 242, 255, 0.28);
  background: linear-gradient(180deg, rgba(6, 28, 58, 0.98), rgba(4, 18, 42, 0.98));
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);
}

.emp-report-modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 12px;
  border-bottom: 1px solid rgba(0, 200, 255, 0.14);

  h2 {
    margin: 0;
    font-size: 22px;
    color: #e8f7ff;
  }
}

.emp-report-modal__headline {
  margin: 8px 0 0;
  color: rgba(184, 236, 255, 0.85);
  font-size: 15px;
  line-height: 1.55;
}

.emp-report-modal__close {
  border: 1px solid rgba(0, 242, 255, 0.35);
  background: rgba(0, 80, 120, 0.35);
  color: #e8f7ff;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    border-color: rgba(0, 242, 255, 0.7);
  }
}

.emp-report-modal__body {
  padding: 16px 20px 20px;
  display: grid;
  gap: 18px;
}

.emp-report-modal__empty {
  padding: 48px 20px;
  text-align: center;
  color: rgba(184, 236, 255, 0.72);
}

.emp-report-modal__block {
  h3 {
    margin: 0 0 10px;
    font-size: 16px;
    color: #9fe8ff;
  }

  ol {
    margin: 0;
    padding-left: 20px;
    color: rgba(200, 232, 255, 0.88);
    line-height: 1.7;
    font-size: 14px;
  }
}

.emp-report-modal__insight {
  margin-bottom: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(0, 242, 255, 0.18);
  background: rgba(4, 28, 58, 0.55);

  h4 {
    margin: 0 0 6px;
    font-size: 16px;
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

.emp-report-modal__evidence {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;

  li {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: baseline;
    font-size: 13px;
    color: rgba(184, 236, 255, 0.78);
  }

  b {
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(0, 242, 255, 0.12);
    color: #7dd3fc;
    font-weight: 600;
  }

  em {
    font-style: normal;
    color: rgba(148, 183, 210, 0.7);
    font-size: 12px;
  }
}

.emp-report-modal__sections {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.emp-report-modal__section {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.14);
  background: rgba(0, 40, 80, 0.28);

  h4 {
    margin: 0 0 8px;
    color: #e8f7ff;
    font-size: 14px;
  }

  ul {
    margin: 0;
    padding-left: 18px;
    color: rgba(200, 232, 255, 0.82);
    font-size: 13px;
    line-height: 1.55;
  }
}

.emp-report-modal__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 200, 255, 0.12);
  color: rgba(148, 183, 210, 0.75);
  font-size: 12px;
}

@media (max-width: 720px) {
  .emp-report-modal__sections {
    grid-template-columns: 1fr;
  }
}
</style>
