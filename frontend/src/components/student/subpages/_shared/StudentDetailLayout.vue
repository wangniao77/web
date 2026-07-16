<script setup lang="ts">
/**
 * 学生端二级页面通用布局
 *
 * 与 CollegeDetailLayout 风格保持一致（科技感渐变 + 网格底纹 + 返回按钮 + 标题 + 副标题）
 * 但标题/路由相关参数都通过 props 传入，不硬编码任何具体业务。
 *
 * 放在 subpages/_shared/ 下，可被任意二级页面复用。
 */
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** 返回按钮文本，默认 "← 返回驾驶舱" */
    backText?: string
    /** 自定义返回路径；不传则使用浏览器历史返回 */
    backTo?: string | { name: string } | { path: string }
    /**
     * 是否为"占满整页"模式：
     * - false（默认）：body 内部滚动，content 自适应高度（适合概览/图表页）
     * - true：body 不滚动，由子内容（如表格区）内部滚动占满剩余空间（适合整页表格）
     */
    full?: boolean
    /** 模拟数据标记，显示在页面标题右侧，不传则不显示 */
    mockBadge?: string
  }>(),
  {
    subtitle: '',
    backText: '← 返回驾驶舱',
    backTo: undefined,
    full: false,
  },
)

const router = useRouter()

function goBack() {
  if (props.backTo) {
    router.push(props.backTo as never)
    return
  }
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(ROUTES.student.root)
  }
}
</script>

<template>
  <div class="student-detail">
    <div class="student-detail__mesh" aria-hidden="true" />
    <header class="student-detail__header">
      <button type="button" class="student-detail__back" @click="goBack">
        {{ backText }}
      </button>
      <div class="student-detail__title">
        <h1>{{ title }}<span v-if="mockBadge" class="student-detail__mock-badge">{{ mockBadge }}</span></h1>
        <span v-if="subtitle">{{ subtitle }}</span>
      </div>
      <div class="student-detail__header-glow" aria-hidden="true" />
    </header>
    <main class="student-detail__body" :class="{ 'student-detail__body--full': full }">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
.student-detail {
  position: relative;
  isolation: isolate;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0 4px 10px;
  overflow: hidden;
  color: #eaf3ff;

  &::before {
    position: absolute;
    inset: -18px 0 auto;
    height: 180px;
    z-index: -2;
    pointer-events: none;
    background:
      linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.16), transparent),
      linear-gradient(180deg, rgba(16, 73, 132, 0.18), transparent);
    content: '';
  }
}

.student-detail__mesh {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    linear-gradient(rgba(0, 242, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 242, 255, 0.035) 1px, transparent 1px),
    linear-gradient(120deg, transparent 0 34%, rgba(139, 92, 246, 0.08) 34.2%, transparent 35% 100%);
  background-size: 36px 36px, 36px 36px, 100% 100%;
  opacity: 0.55;
}

.student-detail__header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 70px;
  margin: 0 0 12px;
  padding: 10px 14px;
  overflow: hidden;
  border: 1px solid rgba(102, 217, 255, 0.18);
  border-radius: 8px;
  background:
    linear-gradient(100deg, rgba(0, 184, 255, 0.18), transparent 34%),
    linear-gradient(180deg, rgba(6, 22, 56, 0.82), rgba(3, 10, 30, 0.9));
  box-shadow:
    0 12px 30px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 0 28px rgba(0, 184, 255, 0.08);
  flex-shrink: 0;
}

.student-detail__header-glow {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.95), rgba(52, 211, 153, 0.65), transparent);
  box-shadow: 0 0 16px rgba(0, 242, 255, 0.55);
  pointer-events: none;
}

.student-detail__back {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid rgba(0, 242, 255, 0.32);
  background:
    linear-gradient(180deg, rgba(0, 184, 255, 0.14), rgba(4, 18, 48, 0.58)),
    rgba(0, 184, 255, 0.08);
  color: #8ef6ff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  box-shadow: inset 0 0 14px rgba(0, 242, 255, 0.08);
  transition: border-color 0.2s, color 0.2s, box-shadow 0.2s, background 0.2s;

  &:hover {
    border-color: rgba(0, 242, 255, 0.72);
    background:
      linear-gradient(180deg, rgba(0, 242, 255, 0.22), rgba(4, 18, 48, 0.66)),
      rgba(0, 184, 255, 0.12);
    color: #ffffff;
    box-shadow: 0 0 18px rgba(0, 242, 255, 0.22), inset 0 0 16px rgba(0, 242, 255, 0.12);
  }
}

.student-detail__title {
  position: relative;
  z-index: 1;
  min-width: 0;

  h1 {
    position: relative;
    margin: 0 0 4px;
    color: #f6fbff;
    font-size: 24px;
    line-height: 1.15;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-shadow: 0 0 16px rgba(0, 242, 255, 0.38);
  }

  span {
    font-size: 15px;
    color: rgba(184, 236, 255, 0.74);
  }
}

.student-detail__mock-badge {
  display: inline-block;
  margin-left: 10px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #f0a040;
  border: 1px solid rgba(240, 160, 64, 0.5);
  border-radius: 4px;
  background: rgba(240, 160, 64, 0.1);
  vertical-align: middle;
  letter-spacing: 0.03em;
  text-shadow: none;
  box-shadow: 0 0 8px rgba(240, 160, 64, 0.15);
}

.student-detail__body {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 2px 4px 18px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 242, 255, 0.28) transparent;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 242, 255, 0.28);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &--full {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}
</style>
