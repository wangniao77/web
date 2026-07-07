<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import CollegePanelCard from '@/domains/college/components/CollegePanelCard.vue'
import type {
  AiAssistantVM,
  AttentionItemVM,
  EmploymentVM,
  HighlightItemVM,
} from '@/domains/student/types/view'

const Caibao3D = defineAsyncComponent(() => import('@/domains/student/components/mascot/Caibao3D.vue'))

const props = defineProps<{
  data: AiAssistantVM
  highlights: HighlightItemVM[]
  attention: AttentionItemVM[]
  employment: EmploymentVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const HONOR_KEYWORDS = ['奖学金', '优秀学生', '三好学生', '共青团员', '干部']

const growthHighlights = computed(() =>
  props.highlights.filter((h) => !HONOR_KEYWORDS.some((k) => h.label.includes(k))),
)

const matchScore = computed(() =>
  Math.round((props.employment.jobReadiness + props.employment.certificateReadiness) / 2),
)

const pathSteps = computed(() => [
  { key: 'short', label: '短期', text: props.employment.developmentPath.short, tone: 'cyan' },
  { key: 'medium', label: '中期', text: props.employment.developmentPath.medium, tone: 'violet' },
  { key: 'long', label: '长期', text: props.employment.developmentPath.long, tone: 'gold' },
])

function ringDash(pct: number, r = 28) {
  const c = 2 * Math.PI * r
  return `${(pct / 100) * c} ${c}`
}

function highlightTag(label: string) {
  if (/竞赛|ACM|建模/.test(label)) return { text: '竞赛', cls: 'tag-comp' }
  if (/证书|Python|机器学习/.test(label)) return { text: '证书', cls: 'tag-cert' }
  if (/项目|平台|立项|创新/.test(label)) return { text: '项目', cls: 'tag-proj' }
  return { text: '亮点', cls: 'tag-default' }
}
</script>

<template>
  <CollegePanelCard
    :index="3"
    :title="data.title"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="ai-assistant">
      <!-- Hero -->
      <header class="ai-hero">
        <div class="ai-hero__left">
          <div class="ai-hero__mascot">
            <Caibao3D :size="42" />
            <span class="ai-hero__mascot-name">财宝</span>
          </div>
          <div class="ai-hero__copy">
            <span class="ai-hero__eyebrow">
              <i class="ai-hero__spark" aria-hidden="true" />
              AI 智能推荐
            </span>
            <strong class="ai-hero__direction">{{ data.recommendedDirection }}</strong>
            <p class="ai-hero__hint">基于学业、竞赛、实践与就业画像综合匹配</p>
          </div>
        </div>
        <div class="match-ring" aria-label="综合匹配度">
          <svg viewBox="0 0 72 72" class="match-ring__svg">
            <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(0,212,255,0.12)" stroke-width="5" />
            <circle
              cx="36" cy="36" r="28" fill="none"
              stroke="url(#matchGrad)" stroke-width="5" stroke-linecap="round"
              :stroke-dasharray="ringDash(matchScore)"
              transform="rotate(-90 36 36)"
            />
            <defs>
              <linearGradient id="matchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00d4ff" />
                <stop offset="100%" stop-color="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
          <div class="match-ring__center">
            <strong>{{ matchScore }}<i>%</i></strong>
            <span>匹配度</span>
          </div>
        </div>
      </header>

      <!-- Insight dual panels -->
      <div class="ai-insight">
        <section class="glass glass--highlights">
          <h4 class="glass__title">
            成长亮点
            <em v-if="growthHighlights.length" class="glass__count">{{ growthHighlights.length }}</em>
          </h4>
          <ul v-if="growthHighlights.length" class="highlight-list">
            <li v-for="item in growthHighlights" :key="item.id" class="highlight-item">
              <span class="highlight-item__rail" aria-hidden="true">
                <i class="highlight-item__dot" />
              </span>
              <div class="highlight-item__body">
                <span class="highlight-item__tag" :class="highlightTag(item.label).cls">
                  {{ highlightTag(item.label).text }}
                </span>
                <span class="highlight-item__label">{{ item.label }}</span>
              </div>
              <time v-if="item.date" class="highlight-item__date">{{ item.date }}</time>
            </li>
          </ul>
          <p v-else class="glass__empty">暂无成长亮点记录</p>
        </section>

        <section class="glass glass--attention">
          <h4 class="glass__title">
            需关注事项
            <em v-if="attention.length" class="glass__count glass__count--warn">{{ attention.length }}</em>
          </h4>
          <ul class="attention-list">
            <li
              v-for="item in attention"
              :key="item.id"
              class="attention-item"
              :class="`attention-item--${item.level}`"
            >
              <span class="attention-item__stripe" aria-hidden="true" />
              <div class="attention-item__content">
                <div class="attention-item__head">
                  <span class="attention-item__cat">{{ item.category }}</span>
                  <span class="attention-item__level">{{ item.levelLabel }}</span>
                </div>
                <p class="attention-item__text">{{ item.label }}</p>
              </div>
            </li>
            <li v-if="!attention.length" class="attention-item attention-item--ok">
              <p class="attention-item__text">暂无需要关注的事项</p>
            </li>
          </ul>
        </section>
      </div>

      <!-- Readiness gauges -->
      <section class="readiness">
        <div class="gauge-row">
          <div class="gauge-card">
            <div class="gauge-card__ring">
              <svg viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="24" fill="none" stroke="rgba(0,212,255,0.12)" stroke-width="5" />
                <circle
                  cx="32" cy="32" r="24" fill="none" stroke="#00d4ff" stroke-width="5"
                  stroke-linecap="round" :stroke-dasharray="ringDash(employment.jobReadiness, 24)"
                  transform="rotate(-90 32 32)"
                />
              </svg>
              <strong>{{ employment.jobReadiness }}<i>%</i></strong>
            </div>
            <span class="gauge-card__label">就业就绪</span>
          </div>
          <div class="gauge-card gauge-card--cert">
            <div class="gauge-card__ring">
              <svg viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="24" fill="none" stroke="rgba(139,92,246,0.12)" stroke-width="5" />
                <circle
                  cx="32" cy="32" r="24" fill="none" stroke="#a78bfa" stroke-width="5"
                  stroke-linecap="round" :stroke-dasharray="ringDash(employment.certificateReadiness, 24)"
                  transform="rotate(-90 32 32)"
                />
              </svg>
              <strong>{{ employment.certificateReadiness }}<i>%</i></strong>
            </div>
            <span class="gauge-card__label">证书就绪</span>
          </div>
          <div class="career-block">
            <span class="career-block__title">职业方向</span>
            <div class="tag-row">
              <span
                v-for="(dir, i) in employment.careerDirections"
                :key="dir"
                class="career-tag"
                :class="{ 'career-tag--primary': i === 0 }"
              >{{ dir }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Growth path -->
      <section class="path-track">
        <h4 class="path-track__title">成长路径</h4>
        <div class="path-track__steps">
          <div
            v-for="(step, i) in pathSteps"
            :key="step.key"
            class="path-step"
            :class="`path-step--${step.tone}`"
          >
            <span class="path-step__node">{{ step.label }}</span>
            <p class="path-step__text">{{ step.text }}</p>
            <i v-if="i < pathSteps.length - 1" class="path-step__arrow" aria-hidden="true">→</i>
          </div>
        </div>
      </section>

      <!-- Advice bento -->
      <div class="ai-advice">
        <section class="advice-card advice-card--basis">
          <h4 class="advice-card__title">匹配依据</h4>
          <ul class="basis-tags">
            <li v-for="(item, i) in data.matchBasis" :key="i">
              <span class="basis-tags__check" aria-hidden="true">✓</span>
              {{ item }}
            </li>
          </ul>
        </section>

        <section class="advice-card">
          <h4 class="advice-card__title">短期建议</h4>
          <ol class="suggest-list">
            <li v-for="(item, i) in data.shortTermSuggestions" :key="i">
              <span class="suggest-list__idx">{{ i + 1 }}</span>
              <span>{{ item }}</span>
            </li>
          </ol>
        </section>

        <section class="advice-card advice-card--long">
          <h4 class="advice-card__title">长期规划</h4>
          <ol class="suggest-list suggest-list--long">
            <li v-for="(item, i) in data.longTermSuggestions" :key="i">
              <span class="suggest-list__idx">{{ i + 1 }}</span>
              <span>{{ item }}</span>
            </li>
          </ol>
        </section>
      </div>
    </div>
  </CollegePanelCard>
</template>

<style scoped lang="scss">
.ai-assistant {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 7px;
  overflow: hidden;
}

// ── Hero ───────────────────────────────────────────────────
.ai-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 11px;
  border-radius: 8px;
  flex-shrink: 0;
  background:
    linear-gradient(120deg, rgba(0, 212, 255, 0.11) 0%, rgba(139, 92, 246, 0.07) 50%, transparent 100%),
    rgba(6, 20, 48, 0.55);
  border: 1px solid rgba(0, 212, 255, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.ai-hero__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.ai-hero__mascot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.ai-hero__mascot-name {
  font-size: var(--fs-meta);
  font-weight: 700;
  color: rgba(240, 192, 64, 0.9);
}

.ai-hero__copy { min-width: 0; }

.ai-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--fs-label);
  color: rgba(186, 208, 236, 0.75);
}

.ai-hero__spark {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $color-accent-cyan;
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.8);
  animation: ai-pulse 2.4s ease-in-out infinite;
}

.ai-hero__direction {
  display: block;
  margin-top: 3px;
  font-size: var(--fs-title);
  font-weight: 700;
  line-height: 1.3;
  color: $color-accent-cyan;
  text-shadow: 0 0 16px rgba(0, 212, 255, 0.35);
}

.ai-hero__hint {
  margin: 2px 0 0;
  font-size: var(--fs-meta);
  color: rgba(186, 208, 236, 0.55);
  line-height: 1.25;
}

.match-ring {
  position: relative;
  flex-shrink: 0;
  width: 74px;
  height: 74px;

  &__svg { width: 100%; height: 100%; }

  &__center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    strong {
      font-family: var(--student-font-number, inherit);
      font-size: 21px;
      font-weight: 700;
      line-height: 1;
      color: #eef5ff;
      text-shadow: 0 0 10px rgba(0, 212, 255, 0.4);

      i { font-style: normal; font-size: 0.55em; opacity: 0.7; }
    }

    span {
      margin-top: 2px;
      font-size: var(--fs-micro);
      color: rgba(186, 208, 236, 0.6);
    }
  }
}

// ── Insight panels ─────────────────────────────────────────
.ai-insight {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}

.glass {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 6px 9px;
  border-radius: 8px;
  background: rgba(4, 14, 36, 0.45);
  border: 1px solid rgba(0, 212, 255, 0.08);

  &--attention { border-color: rgba(248, 113, 113, 0.1); }
}

.glass__title {
  margin: 0 0 3px;
  font-size: var(--fs-label);
  font-weight: 600;
  color: rgba(210, 228, 252, 0.92);
  padding-left: 9px;
  position: relative;
  flex-shrink: 0;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 12px;
    border-radius: 2px;
    background: linear-gradient(180deg, $color-accent-cyan, rgba(0, 212, 255, 0.15));
  }
}

.glass--attention .glass__title::before {
  background: linear-gradient(180deg, $color-danger, rgba(248, 113, 113, 0.15));
}

.glass__count {
  font-style: normal;
  font-weight: 700;
  margin-left: 4px;
  color: rgba(240, 192, 64, 0.95);
  font-family: var(--student-font-number, inherit);

  &--warn { color: rgba(248, 113, 113, 0.9); }
}

.glass__empty {
  margin: 0;
  padding: 6px 2px;
  font-size: var(--fs-label);
  color: rgba(186, 208, 236, 0.55);
}

.highlight-list,
.attention-list {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 212, 255, 0.25) transparent;
}

.highlight-item {
  display: grid;
  grid-template-columns: 14px 1fr auto;
  gap: 6px;
  padding: 2px 2px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.05);

  &:last-child { border-bottom: none; }

  &__rail {
    display: flex;
    justify-content: center;
    padding-top: 6px;
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: $color-accent-cyan;
    box-shadow: 0 0 6px rgba(0, 212, 255, 0.5);
  }

  &__body {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  &__tag {
    align-self: flex-start;
    font-size: var(--fs-micro);
    padding: 0 6px;
    line-height: 17px;
    border-radius: 3px;

    &.tag-comp { background: rgba(0, 212, 255, 0.12); color: $color-accent-cyan; }
    &.tag-cert { background: rgba(139, 92, 246, 0.14); color: #c4b5fd; }
    &.tag-proj { background: rgba(52, 211, 153, 0.12); color: $color-success; }
    &.tag-default { background: rgba(186, 208, 236, 0.1); color: rgba(186, 208, 236, 0.7); }
  }

  &__label {
    font-size: var(--fs-label);
    color: rgba(224, 238, 255, 0.94);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__date {
    font-size: var(--fs-meta);
    font-family: var(--student-font-number, inherit);
    color: rgba(186, 208, 236, 0.5);
    white-space: nowrap;
    padding-top: 3px;
  }
}

.attention-item {
  position: relative;
  display: flex;
  gap: 8px;
  padding: 6px 8px 6px 0;
  margin-bottom: 4px;
  border-radius: 6px;
  background: rgba(248, 113, 113, 0.05);
  border: 1px solid rgba(248, 113, 113, 0.15);
  overflow: hidden;

  &:last-child { margin-bottom: 0; }

  &--medium {
    background: rgba(251, 146, 60, 0.05);
    border-color: rgba(251, 146, 60, 0.18);
    .attention-item__stripe { background: $color-warning; }
    .attention-item__cat { color: $color-warning; }
    .attention-item__level { background: rgba(251, 146, 60, 0.15); color: $color-warning; }
  }

  &--low {
    background: rgba(240, 192, 64, 0.05);
    border-color: rgba(240, 192, 64, 0.16);
    .attention-item__stripe { background: $color-accent-gold; }
    .attention-item__cat { color: $color-accent-gold; }
    .attention-item__level { background: rgba(240, 192, 64, 0.12); color: $color-accent-gold; }
  }

  &--ok {
    justify-content: center;
    border-color: rgba(52, 211, 153, 0.2);
    background: rgba(52, 211, 153, 0.06);
    color: $color-success;
    .attention-item__stripe { display: none; }
  }

  &__stripe {
    width: 3px;
    flex-shrink: 0;
    border-radius: 0 2px 2px 0;
    background: $color-danger;
  }

  &__content { flex: 1; min-width: 0; }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 2px;
  }

  &__cat {
    font-size: var(--fs-meta);
    font-weight: 600;
    color: $color-danger;
  }

  &__level {
    font-size: var(--fs-meta);
    padding: 1px 7px;
    border-radius: 4px;
    background: rgba(248, 113, 113, 0.15);
    color: $color-danger;
  }

  &__text {
    margin: 0;
    font-size: var(--fs-label);
    color: rgba(224, 238, 255, 0.9);
    line-height: 1.3;
  }
}

// ── Readiness gauges ───────────────────────────────────────
.readiness {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(139, 92, 246, 0.08), rgba(0, 212, 255, 0.05)),
    rgba(8, 18, 42, 0.45);
  border: 1px solid rgba(139, 92, 246, 0.14);
}

.gauge-row {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 12px;
  align-items: center;
}

.gauge-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;

  &__ring {
    position: relative;
    width: 46px;
    height: 46px;

    svg { width: 100%; height: 100%; }

    strong {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--student-font-number, inherit);
      font-size: 16px;
      font-weight: 700;
      color: $color-accent-cyan;

      i { font-style: normal; font-size: 0.55em; opacity: 0.7; }
    }
  }

  &__label {
    font-size: var(--fs-meta);
    color: rgba(200, 218, 244, 0.7);
  }

  &--cert .gauge-card__ring strong { color: #c4b5fd; }
}

.career-block {
  min-width: 0;
  padding-left: 8px;
  border-left: 1px solid rgba(0, 212, 255, 0.1);

  &__title {
    display: block;
    font-size: var(--fs-meta);
    color: rgba(186, 208, 236, 0.6);
    margin-bottom: 5px;
  }
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.career-tag {
  padding: 3px 10px;
  font-size: var(--fs-label);
  color: rgba(224, 238, 255, 0.85);
  background: rgba(0, 212, 255, 0.06);
  border: 1px solid rgba(0, 212, 255, 0.12);
  border-radius: 20px;
  white-space: nowrap;

  &--primary {
    color: $color-accent-cyan;
    background: rgba(0, 212, 255, 0.12);
    border-color: rgba(0, 212, 255, 0.28);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.15);
  }
}

// ── Growth path ────────────────────────────────────────────
.path-track {
  flex-shrink: 0;
  padding: 5px 9px;
  border-radius: 8px;
  background: rgba(4, 14, 36, 0.4);
  border: 1px solid rgba(0, 212, 255, 0.08);

  &__title {
    margin: 0 0 4px;
    font-size: var(--fs-label);
    font-weight: 600;
    color: rgba(210, 228, 252, 0.88);
  }

  &__steps {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
  }
}

.path-step {
  position: relative;
  padding: 4px 7px;
  border-radius: 6px;
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.1);

  &--violet {
    background: rgba(139, 92, 246, 0.06);
    border-color: rgba(139, 92, 246, 0.14);
    .path-step__node { color: #c4b5fd; background: rgba(139, 92, 246, 0.15); }
  }

  &--gold {
    background: rgba(240, 192, 64, 0.05);
    border-color: rgba(240, 192, 64, 0.12);
    .path-step__node { color: $color-accent-gold; background: rgba(240, 192, 64, 0.12); }
  }

  &__node {
    display: inline-block;
    font-size: var(--fs-micro);
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 4px;
    color: $color-accent-cyan;
    background: rgba(0, 212, 255, 0.12);
    margin-bottom: 2px;
  }

  &__text {
    margin: 0;
    font-size: var(--fs-meta);
    color: rgba(224, 238, 255, 0.85);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__arrow {
    position: absolute;
    right: -8px;
    top: 50%;
    transform: translateY(-50%);
    font-style: normal;
    font-size: var(--fs-meta);
    color: rgba(186, 208, 236, 0.35);
    z-index: 1;
  }
}

// ── Advice bento ───────────────────────────────────────────
.ai-advice {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 0.95fr 1fr 1fr;
  gap: 7px;
}

.advice-card {
  padding: 4px 8px;
  border-radius: 7px;
  background: rgba(4, 14, 36, 0.4);
  border: 1px solid rgba(0, 212, 255, 0.07);
  min-width: 0;

  &--basis {
    border-color: rgba(0, 212, 255, 0.12);
    background: linear-gradient(160deg, rgba(0, 212, 255, 0.06), rgba(4, 14, 36, 0.35));
  }

  &--long {
    border-color: rgba(240, 192, 64, 0.12);
    background: linear-gradient(160deg, rgba(240, 192, 64, 0.05), rgba(4, 14, 36, 0.35));
  }
}

.advice-card__title {
  margin: 0 0 3px;
  font-size: var(--fs-label);
  font-weight: 600;
  color: rgba(210, 228, 252, 0.88);
}

.basis-tags {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    font-size: var(--fs-meta);
    color: rgba(224, 238, 255, 0.88);
    line-height: 1.25;
  }

  &__check {
    flex-shrink: 0;
    color: $color-accent-cyan;
    font-size: var(--fs-micro);
    margin-top: 1px;
  }
}

.suggest-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    font-size: var(--fs-meta);
    color: rgba(224, 238, 255, 0.88);
    line-height: 1.25;
  }

  &__idx {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    display: grid;
    place-items: center;
    font-size: var(--fs-micro);
    font-weight: 700;
    font-family: var(--student-font-number, inherit);
    color: $color-accent-cyan;
    background: rgba(0, 212, 255, 0.12);
    border-radius: 50%;
  }

  &--long .suggest-list__idx {
    color: $color-accent-gold;
    background: rgba(240, 192, 64, 0.12);
  }
}

@keyframes ai-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.25); }
}
</style>
