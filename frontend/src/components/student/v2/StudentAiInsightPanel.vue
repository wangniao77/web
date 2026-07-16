<script setup lang="ts">
import { ref } from 'vue'
import type { AiAssistantVM, AiPortraitVM } from '@/types/student/view'

defineProps<{
  assistant: AiAssistantVM
  portrait: AiPortraitVM
}>()

const pushClass = {
  warn: 'push--warn',
  info: 'push--info',
  success: 'push--success',
} as const

const selectedJobIdx = ref(0)
</script>

<template>
  <div class="stu-ai-hub">
    <header class="stu-ai-hub__header">
      <div class="stu-ai-hub__title">
        <span class="stu-ai-hub__glyph">AI</span>
        <div>
          <h3>{{ assistant.title }}</h3>
          <p>智能画像 · 成长引导 · 实时推送</p>
        </div>
      </div>
      <img v-if="assistant.mascotUrl" :src="assistant.mascotUrl" alt="" class="stu-ai-hub__mascot" />
    </header>

    <section class="stu-ai-hub__summary">
      <span class="stu-ai-hub__label">画像结论</span>
      <p>{{ portrait.summary }}</p>
      <div class="stu-ai-hub__tags">
        <span v-for="tag in portrait.portraitTags" :key="tag" class="stu-ai-tag">{{ tag }}</span>
      </div>
    </section>

    <section class="stu-ai-hub__pushes">
      <span class="stu-ai-hub__label">智能推送</span>
      <ul>
        <li v-for="(push, i) in portrait.pushes" :key="i" :class="pushClass[push.type]">
          <time>{{ push.time }}</time>
          <p>{{ push.text }}</p>
        </li>
      </ul>
    </section>

    <section v-if="portrait.jobMatches.length" class="stu-ai-hub__jobs">
      <span class="stu-ai-hub__label">岗位匹配（大三推荐）</span>
      <div class="stu-ai-hub__job-split">
        <div class="stu-ai-hub__job-list">
          <div
            v-for="(job, idx) in portrait.jobMatches.slice(0, 5)"
            :key="job.role"
            class="stu-ai-hub__job-item"
            :class="{ 'is-active': selectedJobIdx === idx }"
            @click="selectedJobIdx = idx"
          >
            <span>{{ job.role }}</span>
            <strong>{{ job.match }}%</strong>
          </div>
        </div>
        <div class="stu-ai-hub__job-detail">
          <strong>{{ portrait.jobMatches[selectedJobIdx].role }}</strong>
          <div class="stu-ai-hub__job-meta">
            <div><label>城市</label><span>{{ portrait.jobMatches[selectedJobIdx].city }}</span></div>
            <div><label>薪资</label><span>{{ portrait.jobMatches[selectedJobIdx].salary }}</span></div>
            <div><label>匹配度</label><b>{{ portrait.jobMatches[selectedJobIdx].match }}%</b></div>
          </div>
          <p>{{ portrait.jobMatches[selectedJobIdx].requirements }}</p>
        </div>
      </div>
    </section>

    <section class="stu-ai-hub__suggest">
      <div>
        <span class="stu-ai-hub__label">短期建议</span>
        <ul>
          <li v-for="(s, i) in assistant.shortTermSuggestions" :key="i">{{ s }}</li>
        </ul>
      </div>
      <div>
        <span class="stu-ai-hub__label">长期路径</span>
        <p class="stu-ai-hub__direction">{{ assistant.recommendedDirection }}</p>
        <ul>
          <li v-for="(s, i) in assistant.longTermSuggestions" :key="i">{{ s }}</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.stu-ai-hub__job-split {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 8px;
  min-height: 100px;
}

.stu-ai-hub__job-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stu-ai-hub__job-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.25);
  border: 1px solid rgba(0, 180, 255, 0.06);
  cursor: pointer;
  font-size: var(--fs-meta);
  transition: background 0.15s, border-color 0.15s;

  &:hover { background: rgba(0, 50, 100, 0.35); }
  &.is-active {
    border-color: rgba(0, 180, 255, 0.4);
    background: rgba(0, 60, 120, 0.35);
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

.stu-ai-hub__job-detail {
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(0, 38, 73, 0.25);
  border: 1px solid rgba(0, 180, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 6px;

  > strong {
    font-size: var(--fs-label);
    font-weight: 800;
    color: #eef9ff;
    padding-bottom: 4px;
    border-bottom: 1px solid rgba(0, 180, 255, 0.1);
  }
}

.stu-ai-hub__job-meta {
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

  b {
    font-size: 14px;
    font-weight: 900;
    color: #7ff6ff;
    font-family: var(--student-font-number);
  }
}

.stu-ai-hub__job-detail p {
  margin: 0;
  font-size: 11px;
  color: #c8dff0;
  line-height: 1.4;
}
</style>
