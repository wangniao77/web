<script setup lang="ts">
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

    <section class="stu-ai-hub__jobs">
      <span class="stu-ai-hub__label">岗位匹配（大三推荐）</span>
      <ul>
        <li v-for="job in portrait.jobMatches" :key="job.role">
          <span>{{ job.role }}</span>
          <div class="stu-ai-job-bar"><i :style="{ width: `${job.match}%` }" /></div>
          <strong>{{ job.match }}%</strong>
        </li>
      </ul>
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
