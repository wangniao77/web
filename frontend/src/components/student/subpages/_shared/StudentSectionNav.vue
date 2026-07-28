<script setup lang="ts">
/**
 * 学生二级页固定分区导航（sticky chip 顶栏）
 * 点击后 scrollIntoView 到对应 section id。
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

export type SectionNavItem = { id: string; label: string }

const props = defineProps<{
  items: SectionNavItem[]
  /** 滚动容器选择器；默认在最近的 .student-detail__body 内找目标 */
  scrollRoot?: string
}>()

const activeId = ref(props.items[0]?.id ?? '')

function resolveRoot(): HTMLElement | Document {
  if (props.scrollRoot) {
    const el = document.querySelector(props.scrollRoot)
    if (el instanceof HTMLElement) return el
  }
  const body = document.querySelector('.student-detail__body')
  return body instanceof HTMLElement ? body : document
}

function goTo(id: string) {
  activeId.value = id
  const target = document.getElementById(id)
  if (!target) return
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function syncActiveFromScroll() {
  const root = resolveRoot()
  const scrollTop =
    root instanceof HTMLElement ? root.scrollTop : window.scrollY || document.documentElement.scrollTop
  let current = props.items[0]?.id ?? ''
  for (const item of props.items) {
    const el = document.getElementById(item.id)
    if (!el) continue
    const top =
      root instanceof HTMLElement
        ? el.offsetTop - (root as HTMLElement).offsetTop
        : el.getBoundingClientRect().top + scrollTop
    if (top - 24 <= scrollTop + 8) current = item.id
  }
  if (current) activeId.value = current
}

let rootEl: HTMLElement | Document | null = null
onMounted(() => {
  rootEl = resolveRoot()
  rootEl.addEventListener('scroll', syncActiveFromScroll, { passive: true })
  syncActiveFromScroll()
})
onBeforeUnmount(() => {
  rootEl?.removeEventListener('scroll', syncActiveFromScroll)
})
watch(
  () => props.items.map((i) => i.id).join(','),
  () => {
    if (!props.items.some((i) => i.id === activeId.value)) {
      activeId.value = props.items[0]?.id ?? ''
    }
  },
)
</script>

<template>
  <nav class="stu-sec-nav" aria-label="页面分区导航">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="stu-sec-nav__item"
      :class="{ 'is-active': activeId === item.id }"
      @click="goTo(item.id)"
    >
      {{ item.label }}
    </button>
  </nav>
</template>

<style scoped lang="scss">
.stu-sec-nav {
  /* 父级若是多列 grid，必须通栏且不被同行内容拉高 */
  grid-column: 1 / -1;
  align-self: start;
  height: auto;
  max-height: none;
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 0 0 12px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(6, 17, 52, 0.92);
  border: 1px solid rgba(0, 206, 255, 0.28);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
}

.stu-sec-nav__item {
  /* 自然宽度、靠左排列，不拉伸占满整行 */
  flex: 0 0 auto;
  align-self: center;
  min-width: 0;
  height: auto;
  min-height: 0;
  padding: 9px 16px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: #9ec7e0;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 38, 73, 0.45);
    color: #d0e8f8;
  }

  &.is-active {
    background: linear-gradient(180deg, rgba(0, 184, 255, 0.28), rgba(0, 113, 206, 0.18));
    border-color: rgba(0, 206, 255, 0.55);
    color: #f6fbff;
    box-shadow: 0 0 14px rgba(0, 184, 255, 0.25), inset 0 0 12px rgba(0, 184, 255, 0.1);
  }
}
</style>
