<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import CollegePanelCard from '@/components/college/CollegePanelCard.vue'
import StudentPanelBorder from '@/components/student/StudentPanelBorder.vue'
import type { AiAssistantVM, AiPortraitVM, EmploymentVM } from '@/types/student/view'

const Caibao3D = defineAsyncComponent(() => import('@/components/student/mascot/Caibao3D.vue'))

const props = defineProps<{
  assistant: AiAssistantVM
  portrait: AiPortraitVM
  employment: EmploymentVM
}>()

const matchScore = computed(() =>
  Math.round((props.employment.jobReadiness + props.employment.certificateReadiness) / 2),
)

function ringDash(pct: number, r = 30) {
  const c = 2 * Math.PI * r
  return `${(pct / 100) * c} ${c}`
}
</script>

<template>
  <StudentPanelBorder variant="13">
    <CollegePanelCard :index="3" title="财宝 AI · 大模型成长建议">
      <div class="stu-ai-plan">
        <header class="stu-ai-plan__hero">
          <div class="stu-ai-plan__mascot">
            <Caibao3D :size="48" />
            <span>财宝 AI</span>
          </div>
          <div class="stu-ai-plan__match">
            <svg viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(0,212,255,0.12)" stroke-width="5" />
              <circle
                cx="36" cy="36" r="30" fill="none"
                stroke="url(#stuMatchGrad)" stroke-width="5" stroke-linecap="round"
                :stroke-dasharray="ringDash(matchScore)"
                transform="rotate(-90 36 36)"
              />
              <defs>
                <linearGradient id="stuMatchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#00d4ff" />
                  <stop offset="100%" stop-color="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
            <div>
              <strong>{{ matchScore }}<i>%</i></strong>
              <span>综合匹配</span>
            </div>
          </div>
        </header>

        <section class="stu-ai-plan__direction">
          <span class="stu-ai-plan__label">主推荐方向</span>
          <div class="stu-ai-plan__chip">{{ assistant.recommendedDirection }}</div>
        </section>

        <section v-if="portrait.summary" class="stu-ai-plan__summary">
          <span class="stu-ai-plan__label">画像结论</span>
          <p>{{ portrait.summary }}</p>
          <div v-if="portrait.portraitTags.length" class="stu-ai-plan__tags">
            <span v-for="tag in portrait.portraitTags" :key="tag">{{ tag }}</span>
          </div>
        </section>

        <section v-if="portrait.pushes?.length" class="stu-ai-plan__pushes">
          <span class="stu-ai-plan__label">模型推送</span>
          <ul>
            <li v-for="(p, i) in portrait.pushes" :key="i" :class="`push--${p.type || 'info'}`">
              <time>{{ p.time }}</time>
              <p>{{ p.text }}</p>
            </li>
          </ul>
        </section>

        <section class="stu-ai-plan__basis">
          <span class="stu-ai-plan__label">匹配依据</span>
          <ul>
            <li v-for="(item, i) in assistant.matchBasis" :key="i">{{ item }}</li>
          </ul>
        </section>

        <div class="stu-ai-plan__advice">
          <section>
            <span class="stu-ai-plan__label">短期建议</span>
            <ol>
              <li v-for="(s, i) in assistant.shortTermSuggestions" :key="i">{{ s }}</li>
            </ol>
          </section>
          <section>
            <span class="stu-ai-plan__label">长期建议</span>
            <ol>
              <li v-for="(s, i) in assistant.longTermSuggestions" :key="i">{{ s }}</li>
            </ol>
          </section>
        </div>

        <section v-if="portrait.jobMatches.length" class="stu-ai-plan__jobs">
          <span class="stu-ai-plan__label">岗位匹配</span>
          <ul>
            <li v-for="job in portrait.jobMatches" :key="job.role">
              <span>{{ job.role }}</span>
              <div class="stu-ai-plan__bar"><i :style="{ width: `${job.match}%` }" /></div>
              <strong>{{ job.match }}%</strong>
            </li>
          </ul>
        </section>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.stu-ai-plan {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding-right: 2px;
}

.stu-ai-plan__hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  background: linear-gradient(120deg, rgba(0, 212, 255, 0.1), rgba(139, 92, 246, 0.08));
  border: 1px solid rgba(0, 212, 255, 0.18);
}

.stu-ai-plan__mascot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: var(--fs-meta);
  color: #8ec8e8;
  font-weight: 700;
}

.stu-ai-plan__match {
  position: relative;
  width: 72px;
  height: 72px;

  svg { width: 100%; height: 100%; }

  div {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    strong {
      font-family: var(--student-font-number);
      font-size: var(--fs-body);
      color: #7ff6ff;

      i { font-style: normal; font-size: 0.6em; }
    }

    span { font-size: var(--fs-micro); color: #8ec8e8; }
  }
}

.stu-ai-plan__label {
  display: block;
  font-size: var(--fs-meta);
  font-weight: 800;
  color: #7fe9ff;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.stu-ai-plan__direction .stu-ai-plan__chip {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: var(--fs-label);
  font-weight: 800;
  color: #fff;
  background: linear-gradient(90deg, rgba(0, 131, 255, 0.55), rgba(124, 58, 237, 0.45));
  border: 1px solid rgba(0, 229, 255, 0.35);
  box-shadow: 0 0 14px rgba(0, 184, 255, 0.25);
}

.stu-ai-plan__summary p {
  margin: 0;
  font-size: var(--fs-meta);
  line-height: 1.5;
  color: #d8eeff;
}

.stu-ai-plan__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;

  span {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: var(--fs-micro);
    color: #c4b5fd;
    background: rgba(124, 58, 237, 0.18);
    border: 1px solid rgba(167, 139, 250, 0.28);
  }
}

.stu-ai-plan__pushes ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stu-ai-plan__pushes li {
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(0, 55, 110, 0.22);
  border: 1px solid rgba(0, 200, 255, 0.12);

  time {
    display: block;
    font-size: var(--fs-micro);
    color: #8ec8e8;
    margin-bottom: 2px;
  }

  p {
    margin: 0;
    font-size: var(--fs-meta);
    color: #d8eeff;
    line-height: 1.4;
  }

  &.push--warn {
    border-color: rgba(251, 191, 36, 0.35);
    background: rgba(251, 191, 36, 0.08);
  }

  &.push--success {
    border-color: rgba(52, 211, 153, 0.35);
    background: rgba(52, 211, 153, 0.08);
  }
}

.stu-ai-plan__basis ul,
.stu-ai-plan__advice ol {
  margin: 0;
  padding-left: 18px;
  font-size: var(--fs-meta);
  color: #c8e0f0;
  line-height: 1.45;
}

.stu-ai-plan__advice {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stu-ai-plan__jobs ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stu-ai-plan__jobs li {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-meta);
  color: #d0e8ff;

  strong { color: #7ff6ff; font-family: var(--student-font-number); }
}

.stu-ai-plan__bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 60, 120, 0.45);
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #a78bfa, #06b6d4);
  }
}
</style>
