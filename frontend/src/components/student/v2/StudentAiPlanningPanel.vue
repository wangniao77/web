<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue'
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

const selectedJobIdx = ref(0)
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
          <span class="stu-ai-plan__label">岗位匹配 <i class="mock-tag">模拟数据</i></span>
          <div class="stu-ai-plan__job-split">
            <div class="stu-ai-plan__job-list">
              <div
                v-for="(job, idx) in portrait.jobMatches.slice(0, 8)"
                :key="job.role"
                class="stu-ai-plan__job-item"
                :class="{ 'is-active': selectedJobIdx === idx }"
                @click="selectedJobIdx = idx"
              >
                <span>{{ job.role }}</span>
                <strong>{{ job.match }}%</strong>
              </div>
            </div>
            <div class="stu-ai-plan__job-detail">
              <strong>{{ portrait.jobMatches[selectedJobIdx].role }}</strong>
              <div class="stu-ai-plan__job-meta">
                <div><label>城市</label><span>{{ portrait.jobMatches[selectedJobIdx].city }}</span></div>
                <div><label>薪资</label><span>{{ portrait.jobMatches[selectedJobIdx].salary }}</span></div>
                <div><label>匹配度</label><strong class="stu-ai-plan__job-match">{{ portrait.jobMatches[selectedJobIdx].match }}%</strong></div>
              </div>
              <p class="stu-ai-plan__job-req">{{ portrait.jobMatches[selectedJobIdx].requirements }}</p>
            </div>
          </div>
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

.stu-ai-plan__jobs {
  .stu-ai-plan__job-split {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 8px;
    min-height: 120px;
  }

  .stu-ai-plan__job-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .stu-ai-plan__job-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 5px 8px;
    border-radius: 4px;
    background: rgba(0, 38, 73, 0.25);
    border: 1px solid rgba(167, 139, 250, 0.08);
    cursor: pointer;
    font-size: var(--fs-meta);
    transition: background 0.15s, border-color 0.15s;

    &:hover { background: rgba(0, 50, 100, 0.35); }
    &.is-active {
      border-color: rgba(167, 139, 250, 0.4);
      background: rgba(80, 50, 140, 0.3);
    }

    span {
      color: #d0e8ff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    strong {
      color: #7ff6ff;
      font-family: var(--student-font-number);
      white-space: nowrap;
    }
  }

  .stu-ai-plan__job-detail {
    padding: 8px 10px;
    border-radius: 6px;
    background: rgba(0, 38, 73, 0.25);
    border: 1px solid rgba(167, 139, 250, 0.12);
    display: flex;
    flex-direction: column;
    gap: 6px;

    > strong {
      font-size: var(--fs-label);
      font-weight: 800;
      color: #eef9ff;
      padding-bottom: 4px;
      border-bottom: 1px solid rgba(167, 139, 250, 0.12);
    }
  }

  .stu-ai-plan__job-meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;

    div {
      padding: 4px 6px;
      border-radius: 3px;
      background: rgba(0, 56, 100, 0.3);

      label {
        display: block;
        font-size: 10px;
        color: #7eb4d8;
        font-weight: 600;
      }

      span {
        font-size: 12px;
        font-weight: 700;
        color: #d0e8f8;
      }
    }
  }

  .stu-ai-plan__job-match {
    font-size: 14px;
    font-weight: 900;
    color: #7ff6ff;
    font-family: var(--student-font-number);
  }

  .stu-ai-plan__job-req {
    margin: 0;
    font-size: 11px;
    color: #c8dff0;
    line-height: 1.4;
  }
}
</style>
