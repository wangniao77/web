<script setup lang="ts">
import CollegePanelCard from '@/components/college/CollegePanelCard.vue'
import StudentPanelBorder from '@/components/student/StudentPanelBorder.vue'
import type { AiPortraitVM, AiAssistantVM, AttentionItemVM } from '@/types/student/view'

defineProps<{
  portrait: AiPortraitVM
  assistant: AiAssistantVM
  attention: AttentionItemVM[]
}>()
</script>

<template>
  <StudentPanelBorder variant="13">
    <CollegePanelCard title="成长总结与建议">
      <div class="stu-summary">
        <p class="stu-summary__text">{{ portrait.summary || assistant.recommendedDirection }}</p>

        <section v-if="portrait.pushes.length" class="stu-summary__pushes">
          <h4>智能推送</h4>
          <ul>
            <li v-for="(push, i) in portrait.pushes.slice(0, 3)" :key="i" :class="`stu-summary__push--${push.type}`">
              <time>{{ push.time }}</time>
              <p>{{ push.text }}</p>
            </li>
          </ul>
        </section>

        <section class="stu-summary__checklist">
          <h4>短期行动清单</h4>
          <ul>
            <li v-for="(s, i) in assistant.shortTermSuggestions" :key="i">
              <span class="stu-summary__check">✓</span>
              {{ s }}
            </li>
          </ul>
        </section>

        <section v-if="attention.length" class="stu-summary__warn">
          <h4>需关注 {{ attention.length }} 项</h4>
          <p>{{ attention[0].label }}</p>
        </section>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.stu-summary {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.stu-summary__text {
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: var(--fs-meta);
  line-height: 1.55;
  color: #e0f0ff;
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(167, 139, 250, 0.2);
}

.stu-summary h4 {
  margin: 0 0 4px;
  font-size: var(--fs-meta);
  font-weight: 800;
  color: #7fe9ff;
}

.stu-summary__pushes ul,
.stu-summary__checklist ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stu-summary__pushes li {
  padding: 4px 8px;
  border-radius: 4px;
  border-left: 3px solid #39e6ff;
  background: rgba(0, 60, 120, 0.15);

  time { font-size: var(--fs-micro); color: #7a9eb8; }
  p { margin: 2px 0 0; font-size: var(--fs-micro); color: #d8eeff; line-height: 1.35; }

  &.stu-summary__push--warn { border-left-color: #ff6b4a; }
}

.stu-summary__checklist li {
  display: flex;
  gap: 6px;
  font-size: var(--fs-meta);
  color: #c8e0f0;
  line-height: 1.4;
}

.stu-summary__check {
  flex-shrink: 0;
  color: #63ffe1;
  font-weight: 800;
}

.stu-summary__warn p {
  margin: 0;
  font-size: var(--fs-meta);
  color: #ffb07a;
  line-height: 1.4;
}
</style>
