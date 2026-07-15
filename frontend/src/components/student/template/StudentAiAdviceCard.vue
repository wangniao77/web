<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import DashIcon, { type IconKind } from '@/components/college/DashIcon.vue'
import StudentTplCard from './StudentTplCard.vue'
import type { AiAssistantVM, AiPortraitVM, EmploymentVM } from '@/types/student/view'

const props = defineProps<{
  assistant: AiAssistantVM
  portrait: AiPortraitVM
  employment: EmploymentVM
}>()

const emit = defineEmits<{ open: [id: string] }>()

const carouselRef = ref<HTMLElement | null>(null)
const currentPage = ref(0)
const AUTOPLAY_INTERVAL = 6500
let autoplayTimer: ReturnType<typeof setInterval> | null = null

const directionMatch = computed(() => {
  return props.portrait.jobMatches[0]?.match ?? props.employment.jobReadiness
})

/** 首页只展示一句摘要，完整研判进二级页 */
const summaryBrief = computed(() => {
  const text = props.portrait.summary.trim()
  const cut = text.split(/[；。]/)[0] ?? text
  return cut.length > 42 ? `${cut.slice(0, 42)}…` : `${cut}。`
})

const timeline = computed(() => [
  { stage: '本学期', title: '补齐关键短板', icon: 'task' as IconKind },
  { stage: '未来一年', title: '强化项目实践', icon: 'practice' as IconKind },
  { stage: '毕业前', title: '完成方向定型', icon: 'employment' as IconKind },
])

const latestPush = computed(() => props.portrait.pushes[0] ?? null)
const pushCount = computed(() => props.portrait.pushes.length)

function openDetail() {
  emit('open', 'ai')
  // 点击进二级后仍恢复轮播，避免焦点停在卡片上导致停转
  startAutoplay()
}

function stopAutoplay() {
  if (autoplayTimer) clearInterval(autoplayTimer)
  autoplayTimer = null
}

function startAutoplay() {
  stopAutoplay()
  autoplayTimer = setInterval(() => {
    currentPage.value = currentPage.value === 0 ? 1 : 0
  }, AUTOPLAY_INTERVAL)
}

function previousPage() {
  currentPage.value = currentPage.value === 0 ? 1 : 0
  startAutoplay()
}

function nextPage() {
  currentPage.value = currentPage.value === 1 ? 0 : 1
  startAutoplay()
}

function selectPage(page: number) {
  currentPage.value = page
  startAutoplay()
}

function animateVisibleCards() {
  const root = carouselRef.value
  if (!root) return
  const cards = root.querySelectorAll(`.aip-slide:nth-child(${currentPage.value + 1}) .aip-card`)
  gsap.fromTo(
    cards,
    { y: 16, autoAlpha: 0.55, scale: 0.98 },
    {
      y: 0,
      autoAlpha: 1,
      scale: 1,
      duration: 0.42,
      stagger: 0.06,
      ease: 'power2.out',
      overwrite: true,
      clearProps: 'transform',
    },
  )
}

watch(currentPage, async () => {
  await nextTick()
  animateVisibleCards()
})

onMounted(() => {
  startAutoplay()
  animateVisibleCards()
})
onBeforeUnmount(stopAutoplay)
</script>

<template>
  <StudentTplCard icon="innovation" title="AI 画像与建议" class="stu-tpl__ai">
    <div
      ref="carouselRef"
      class="aip-carousel"
      @mouseenter="stopAutoplay"
      @mouseleave="startAutoplay"
    >
      <button type="button" class="aip-nav aip-nav--left" aria-label="上一组" @click="previousPage">‹</button>
      <button type="button" class="aip-nav aip-nav--right" aria-label="下一组" @click="nextPage">›</button>

      <div class="aip-viewport">
        <div class="aip-track" :style="{ transform: `translateX(-${currentPage * 100}%)` }">
          <!-- 第 1 页：研判总览 + 优先行动 -->
          <div class="aip-slide" :aria-hidden="currentPage !== 0">
            <article
              class="aip-card aip-card--judge"
              role="button"
              tabindex="0"
              @click="openDetail"
              @keydown.enter.prevent="openDetail"
              @keydown.space.prevent="openDetail"
            >
              <header class="aip-card__head">
                <span class="aip-card__icon" aria-hidden="true">
                  <DashIcon kind="influence" :size="18" />
                </span>
                <h4>综合研判</h4>
                <span class="aip-status aip-status--live">AI</span>
              </header>

              <div class="aip-hero">
                <div class="aip-hero__score">
                  <span>方向匹配度</span>
                  <strong>{{ directionMatch }}<i>%</i></strong>
                </div>
                <div class="aip-hero__dir">
                  <span>推荐方向</span>
                  <strong>{{ assistant.recommendedDirection }}</strong>
                </div>
              </div>

              <p class="aip-brief">{{ summaryBrief }}</p>

              <div class="aip-tags">
                <span v-for="tag in portrait.portraitTags.slice(0, 3)" :key="tag">{{ tag }}</span>
              </div>
            </article>

            <article
              class="aip-card aip-card--action"
              role="button"
              tabindex="0"
              @click="openDetail"
              @keydown.enter.prevent="openDetail"
              @keydown.space.prevent="openDetail"
            >
              <header class="aip-card__head">
                <span class="aip-card__icon" aria-hidden="true">
                  <DashIcon kind="task" :size="18" stroke="#e8c878" />
                </span>
                <h4>行动建议</h4>
                <span class="aip-status aip-status--warn">优先</span>
              </header>

              <div class="aip-focus">
                <span>本周优先</span>
                <strong>{{ assistant.shortTermSuggestions[0] }}</strong>
              </div>
            </article>
          </div>

          <!-- 第 2 页：路线节点 + 最新推送（明细进二级） -->
          <div class="aip-slide" :aria-hidden="currentPage !== 1">
            <article
              class="aip-card aip-card--path"
              role="button"
              tabindex="0"
              @click="openDetail"
              @keydown.enter.prevent="openDetail"
              @keydown.space.prevent="openDetail"
            >
              <header class="aip-card__head">
                <span class="aip-card__icon" aria-hidden="true">
                  <DashIcon kind="guide" :size="18" stroke="#7eb8ff" />
                </span>
                <h4>阶段成长路线</h4>
                <span class="aip-status aip-status--blue">3 阶段</span>
              </header>

              <div class="aip-path-list">
                <div v-for="item in timeline" :key="item.stage" class="aip-path-item">
                  <span class="aip-path-item__icon" aria-hidden="true">
                    <DashIcon :kind="item.icon" :size="16" />
                  </span>
                  <div>
                    <em>{{ item.stage }}</em>
                    <strong>{{ item.title }}</strong>
                  </div>
                </div>
              </div>
            </article>

            <article
              class="aip-card aip-card--push"
              role="button"
              tabindex="0"
              @click="openDetail"
              @keydown.enter.prevent="openDetail"
              @keydown.space.prevent="openDetail"
            >
              <header class="aip-card__head">
                <span class="aip-card__icon" aria-hidden="true">
                  <DashIcon kind="notify" :size="18" stroke="#55e995" />
                </span>
                <h4>智能推送</h4>
                <span class="aip-status aip-status--ok">{{ pushCount }} 条</span>
              </header>

              <div v-if="latestPush" class="aip-latest" :class="`aip-latest--${latestPush.type}`">
                <em>{{ latestPush.time }}</em>
                <p>{{ latestPush.text }}</p>
              </div>
            </article>
          </div>
        </div>
      </div>

      <div class="aip-pagination" aria-label="AI 画像分页">
        <button
          v-for="page in 2"
          :key="page"
          type="button"
          :class="{ active: currentPage === page - 1 }"
          :aria-label="`第 ${page} 组`"
          @click="selectPage(page - 1)"
        />
        <span>{{ currentPage + 1 }} / 2</span>
      </div>
    </div>
  </StudentTplCard>
</template>

<style scoped lang="scss">
.aip-carousel {
  position: relative;
  height: 100%;
  min-height: 0;
  padding: 4px 36px 24px;
}

.aip-viewport {
  height: 100%;
  overflow: hidden;
}

.aip-track {
  display: flex;
  height: 100%;
  transition: transform 0.72s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.aip-slide {
  flex: 0 0 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.aip-card {
  --card-accent: #1ed6ff;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--card-accent) 34%, transparent);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--card-accent) 10%, transparent), transparent 42%),
    linear-gradient(160deg, rgba(6, 40, 78, 0.9), rgba(0, 16, 38, 0.94));
  box-shadow:
    inset 0 0 24px rgba(0, 90, 160, 0.12),
    inset 0 1px 0 rgba(180, 230, 255, 0.1);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--card-accent) 55%, transparent);
    box-shadow:
      inset 0 0 28px rgba(0, 100, 180, 0.16),
      0 0 18px color-mix(in srgb, var(--card-accent) 14%, transparent);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid #65e9ff;
    outline-offset: 2px;
  }

  &--action { --card-accent: #e8c878; }
  &--path { --card-accent: #7eb8ff; }
  &--push { --card-accent: #55e995; }
}

.aip-card__head {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;

  h4 {
    margin: 0;
    color: #eef9ff;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.03em;
  }
}

.aip-card__icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--card-accent) 40%, transparent);
  border-radius: 2px;
  background: color-mix(in srgb, var(--card-accent) 12%, transparent);
}

.aip-status {
  padding: 3px 8px;
  border: 1px solid;
  border-radius: 2px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;

  &--live {
    border-color: rgba(45, 206, 255, 0.4);
    background: rgba(45, 206, 255, 0.12);
    color: #65dfff;
  }
  &--ok {
    border-color: rgba(74, 222, 128, 0.34);
    background: rgba(74, 222, 128, 0.1);
    color: #55e995;
  }
  &--blue {
    border-color: rgba(126, 184, 255, 0.4);
    background: rgba(126, 184, 255, 0.12);
    color: #9bc8ff;
  }
  &--warn {
    border-color: rgba(232, 200, 120, 0.42);
    background: rgba(232, 200, 120, 0.12);
    color: #e8c878;
  }
}

.aip-hero {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 12px;
  flex-shrink: 0;
}

.aip-hero__score,
.aip-hero__dir {
  min-width: 0;
  padding: 14px 12px;
  border: 1px solid rgba(120, 200, 255, 0.16);
  border-radius: 2px;
  background: rgba(0, 36, 72, 0.4);

  span {
    display: block;
    color: #7eb8d8;
    font-size: 12px;
    font-weight: 600;
  }
  strong {
    display: block;
    margin-top: 8px;
    color: #eef9ff;
    font-weight: 700;
  }
}

.aip-hero__score strong {
  color: #55e5ff;
  font-family: var(--student-font-number);
  font-size: 34px;
  line-height: 1;
  text-shadow: 0 0 14px rgba(0, 204, 255, 0.4);

  i {
    margin-left: 2px;
    font-size: 14px;
    font-style: normal;
  }
}

.aip-hero__dir strong {
  font-size: 16px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.aip-brief {
  margin: 0;
  flex: 1 1 auto;
  min-height: 0;
  color: #d5ebff;
  font-size: 14px;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.aip-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;

  span {
    padding: 5px 11px;
    border: 1px solid rgba(107, 123, 255, 0.28);
    border-radius: 2px;
    color: #c0cbff;
    font-size: 12px;
    font-weight: 600;
    background: rgba(70, 80, 180, 0.14);
  }
}

.aip-focus {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  padding: 22px 18px;
  border: 1px solid rgba(232, 200, 120, 0.28);
  border-radius: 2px;
  background: linear-gradient(160deg, rgba(120, 90, 20, 0.22), rgba(0, 30, 60, 0.4));

  span {
    align-self: flex-start;
    padding: 4px 9px;
    border-radius: 2px;
    background: rgba(255, 183, 77, 0.16);
    color: #ffd166;
    font-size: 12px;
    font-weight: 700;
  }
  strong {
    color: #f5ecd0;
    font-size: 17px;
    font-weight: 600;
    line-height: 1.6;
  }
}

.aip-path-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
}

.aip-path-item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 14px 14px;
  border: 1px solid rgba(120, 200, 255, 0.14);
  border-radius: 2px;
  background: rgba(0, 32, 64, 0.42);
  flex: 1 1 0;

  &__icon {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(126, 184, 255, 0.35);
    border-radius: 2px;
    background: rgba(70, 120, 200, 0.18);
  }

  em {
    display: block;
    color: #67dfff;
    font-size: 12px;
    font-style: normal;
    font-weight: 700;
  }
  strong {
    display: block;
    margin-top: 4px;
    color: #f0f8ff;
    font-size: 16px;
    font-weight: 700;
  }
}

.aip-latest {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 18px 16px;
  border: 1px solid rgba(120, 200, 255, 0.16);
  border-radius: 2px;
  background: rgba(0, 32, 64, 0.42);

  em {
    color: #67dfff;
    font-size: 13px;
    font-style: normal;
    font-weight: 700;
  }
  p {
    margin: 0;
    color: #d5ebff;
    font-size: 14px;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 5;
    overflow: hidden;
  }

  &--warn {
    border-color: rgba(255, 183, 77, 0.3);
    em { color: #ffd166; }
  }
  &--success {
    border-color: rgba(85, 233, 149, 0.3);
    em { color: #55e995; }
  }
}

.aip-nav {
  position: absolute;
  top: 46%;
  z-index: 2;
  width: 28px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
  border: 1px solid rgba(0, 199, 255, 0.34);
  border-radius: 4px;
  background: rgba(0, 30, 64, 0.86);
  color: #62ddff;
  font-size: 22px;
  cursor: pointer;

  &--left { left: 0; }
  &--right { right: 0; }
}

.aip-pagination {
  position: absolute;
  left: 50%;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  transform: translateX(-50%);

  button {
    width: 18px;
    height: 4px;
    padding: 0;
    border: 0;
    border-radius: 99px;
    background: rgba(105, 164, 200, 0.35);
    cursor: pointer;

    &.active {
      width: 30px;
      background: #28d6ff;
      box-shadow: 0 0 8px rgba(40, 214, 255, 0.55);
    }
  }

  span {
    margin-left: 2px;
    color: #6f9ec2;
    font-size: 11px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .aip-track { transition: none; }
}
</style>
