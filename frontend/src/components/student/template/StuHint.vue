<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 新手说明文案 */
    tip: string
    /** 悬停展示的计算公式 */
    formula?: string
    /** 块级包裹（用于卡片标题、整块指标等） */
    block?: boolean
    /** 浮层位置；auto 会按视口空间选择 */
    placement?: 'top' | 'bottom' | 'auto'
    /** 悬停多久后显示（毫秒） */
    delay?: number
    /** 定位锚点选择器：命中则浮层相对该子元素定位（而非整个包裹元素）；用于让浮层贴近特定标签 */
    anchorSelector?: string
  }>(),
  {
    block: false,
    placement: 'auto',
    delay: 450,
    anchorSelector: undefined,
  },
)

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
const floatStyle = ref<Record<string, string>>({})
const resolvedPlacement = ref<'top' | 'bottom'>('top')
let timer: ReturnType<typeof setTimeout> | null = null

function clearTimer() {
  if (timer != null) {
    clearTimeout(timer)
    timer = null
  }
}

function hide() {
  clearTimer()
  open.value = false
}

function show() {
  if (!props.tip?.trim() && !props.formula?.trim()) return
  clearTimer()
  timer = setTimeout(() => {
    const el = rootRef.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const spaceTop = rect.top
    const spaceBottom = window.innerHeight - rect.bottom
    let place: 'top' | 'bottom' = 'top'
    if (props.placement === 'bottom') place = 'bottom'
    else if (props.placement === 'top') place = 'top'
    else place = spaceTop >= 72 || spaceTop >= spaceBottom ? 'top' : 'bottom'

    resolvedPlacement.value = place
    floatStyle.value = {
      left: `${Math.min(window.innerWidth - 16, Math.max(16, rect.left + rect.width / 2))}px`,
      top: place === 'bottom' ? `${rect.bottom + 8}px` : `${rect.top - 8}px`,
      transform: place === 'bottom' ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
    }
    open.value = true
  }, props.delay)
}

onBeforeUnmount(hide)
</script>

<template>
  <component
    :is="block ? 'div' : 'span'"
    ref="rootRef"
    class="stu-hint"
    :class="{ 'stu-hint--block': block, 'stu-hint--formula': Boolean(formula) }"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <slot />
    <Teleport to="body">
      <div
        v-if="open && (tip || formula)"
        class="stu-hint__float"
        :class="[
          `stu-hint__float--${resolvedPlacement}`,
          { 'stu-hint__float--rich': Boolean(formula) },
        ]"
        :style="floatStyle"
        role="tooltip"
      >
        <p v-if="tip" class="stu-hint__text">{{ tip }}</p>
        <div v-if="formula" class="stu-hint__formula">
          <span class="stu-hint__formula-tag">计算公式</span>
          <pre>{{ formula }}</pre>
        </div>
      </div>
    </Teleport>
  </component>
</template>

<style scoped lang="scss">
.stu-hint {
  position: relative;
  display: inline;
  max-width: 100%;
  cursor: help;

  &--block {
    display: block;
  }

  &--formula {
    border-bottom: 1px dashed rgba(127, 246, 255, 0.35);
  }
}
</style>

<style lang="scss">
/* 挂到 body，避免被面板 overflow 裁切 */
.stu-hint__float {
  position: fixed;
  z-index: 10050;
  width: max-content;
  max-width: min(280px, calc(100vw - 24px));
  padding: 8px 10px;
  border: 1px solid rgba(120, 200, 255, 0.4);
  border-radius: 6px;
  background: rgba(6, 22, 44, 0.96);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5);
  color: #d8eefc;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0.02em;
  text-align: left;
  white-space: normal;
  pointer-events: none;

  &--rich {
    max-width: min(340px, calc(100vw - 24px));
  }
}

.stu-hint__text {
  margin: 0;
}

.stu-hint__formula {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed rgba(120, 200, 255, 0.28);

  &:first-child {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }
}

.stu-hint__formula-tag {
  display: inline-block;
  margin-bottom: 4px;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid rgba(0, 212, 255, 0.35);
  background: rgba(0, 184, 255, 0.12);
  color: #7ff6ff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.stu-hint__formula pre {
  margin: 0;
  color: #b8ecff;
  font-family: 'DIN Alternate', Consolas, 'Courier New', monospace;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.stu-hint__float--top::after,
.stu-hint__float--bottom::after {
  content: '';
  position: absolute;
  left: 50%;
  width: 8px;
  height: 8px;
  border: 1px solid rgba(120, 200, 255, 0.4);
  background: rgba(6, 22, 44, 0.96);
  transform: translateX(-50%) rotate(45deg);
}

.stu-hint__float--top::after {
  bottom: -5px;
  border-top: none;
  border-left: none;
}

.stu-hint__float--bottom::after {
  top: -5px;
  border-bottom: none;
  border-right: none;
}
</style>
