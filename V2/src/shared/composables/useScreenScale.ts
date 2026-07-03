import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useScreenStore } from '@/stores/screen'

const DESIGN_WIDTH = 1920
const DESIGN_HEIGHT = 1080

export type ScreenScaleMode = 'contain' | 'cover' | 'adapt' | 'fluid'

export interface ScreenScaleResult {
  scale: number
  canvasWidth: number
  canvasHeight: number
}

export interface ScreenScaleOptions {
  mode?: ScreenScaleMode
  safeInset?: boolean
}

function getViewportSize() {
  const vv = window.visualViewport
  if (vv) {
    return { w: vv.width, h: vv.height }
  }
  return { w: window.innerWidth, h: window.innerHeight }
}

/**
 * fluid（学院大屏推荐）：
 * - 始终以高度为基准缩放 → 顶底完整可见
 * - 宽于 16:9 时拉宽画布至 viewport 宽度 → 消除两侧留白
 */
export function computeScreenScale(
  w: number,
  h: number,
  mode: ScreenScaleMode = 'contain',
  safeInset = false,
): ScreenScaleResult {
  const sx = w / DESIGN_WIDTH
  const sy = h / DESIGN_HEIGHT

  let scale: number
  let canvasWidth: number
  const canvasHeight = DESIGN_HEIGHT

  if (mode === 'cover') {
    scale = Math.max(sx, sy)
    canvasWidth = DESIGN_WIDTH
  } else if (mode === 'fluid' || mode === 'adapt') {
    // 1. 以高度适配，保证 1080 设计高度完整显示
    scale = sy
    canvasWidth = w / scale

    // 2. 画布窄于 1920（偏高屏）：回退标准画布 + contain
    if (canvasWidth < DESIGN_WIDTH) {
      scale = Math.min(sx, sy)
      canvasWidth = DESIGN_WIDTH
    } else {
      canvasWidth = w / scale
    }
  } else {
    scale = Math.min(sx, sy)
    canvasWidth = DESIGN_WIDTH
  }

  if (mode !== 'cover' && safeInset) {
    scale *= 0.995
    canvasWidth = mode === 'fluid' || mode === 'adapt' ? w / scale : DESIGN_WIDTH
  }

  return { scale, canvasWidth, canvasHeight }
}

export function useScreenScale(options: ScreenScaleOptions = {}) {
  const { mode = 'contain', safeInset = false } = options
  const screenStore = useScreenStore()
  const scale = ref(1)
  const canvasWidth = ref(DESIGN_WIDTH)
  const canvasHeight = ref(DESIGN_HEIGHT)
  const viewportW = ref(typeof window !== 'undefined' ? window.innerWidth : DESIGN_WIDTH)
  const viewportH = ref(typeof window !== 'undefined' ? window.innerHeight : DESIGN_HEIGHT)

  function updateScale() {
    const { w, h } = getViewportSize()
    viewportW.value = w
    viewportH.value = h
    const result = computeScreenScale(w, h, mode, safeInset)
    scale.value = result.scale
    canvasWidth.value = result.canvasWidth
    canvasHeight.value = result.canvasHeight
    screenStore.setScale(result.scale)
  }

  onMounted(() => {
    updateScale()
    window.addEventListener('resize', updateScale)
    window.visualViewport?.addEventListener('resize', updateScale)
    document.addEventListener('fullscreenchange', updateScale)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateScale)
    window.visualViewport?.removeEventListener('resize', updateScale)
    document.removeEventListener('fullscreenchange', updateScale)
  })

  const scaleStyle = computed(() => ({
    transform: `scale(${scale.value})`,
  }))

  const canvasStyle = computed(() => ({
    width: `${canvasWidth.value}px`,
    height: `${canvasHeight.value}px`,
  }))

  /** 合并画布尺寸 + 缩放 + 居中偏移（top-left 原点，避免 transform 占位溢出） */
  const stageStyle = computed(() => {
    const sw = canvasWidth.value * scale.value
    const sh = canvasHeight.value * scale.value
    return {
      width: `${canvasWidth.value}px`,
      height: `${canvasHeight.value}px`,
      transform: `scale(${scale.value})`,
      transformOrigin: 'top left',
      marginLeft: `${Math.max(0, (viewportW.value - sw) / 2)}px`,
      marginTop: `${Math.max(0, (viewportH.value - sh) / 2)}px`,
    }
  })

  return {
    scale,
    canvasWidth,
    canvasHeight,
    viewportW,
    viewportH,
    scaleStyle,
    canvasStyle,
    stageStyle,
    designWidth: DESIGN_WIDTH,
    designHeight: DESIGN_HEIGHT,
  }
}
