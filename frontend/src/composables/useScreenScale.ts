import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useScreenStore } from '@/stores/screen'

const DESIGN_WIDTH = 1920
const DESIGN_HEIGHT = 1080

/** fluid 模式下画布最大拉宽比例（相对 1920） */
const FLUID_MAX_WIDTH_RATIO = 1.08
/** 宽屏额外横向空间被吸收的比例（0~1，越小变化越平缓） */
const FLUID_STRETCH_ABSORB = 0.22

export type ScreenScaleMode = 'contain' | 'cover' | 'adapt' | 'fluid' | 'fill'

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
 * contain：等比缩放，画布固定 1920×1080，变化最平稳
 * adapt：同 contain（兼容别名）
 * fluid（学院大屏）：等比缩放 + 宽屏时最多拉宽 8% 画布，避免布局剧烈拉伸
 * fill（学校大屏）：按视口高度等比缩放，横向拉宽画布以铺满全屏
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
  } else if (mode === 'fill') {
    scale = h / DESIGN_HEIGHT
    canvasWidth = w / scale
  } else if (mode === 'fluid') {
    // 以 contain 为基准，缩放变化与窗口宽高同步、无突变
    scale = Math.min(sx, sy)
    const fittedWidth = w / scale
    const maxCanvasWidth = DESIGN_WIDTH * FLUID_MAX_WIDTH_RATIO

    if (fittedWidth <= DESIGN_WIDTH) {
      canvasWidth = DESIGN_WIDTH
    } else {
      const extra = fittedWidth - DESIGN_WIDTH
      canvasWidth = DESIGN_WIDTH + extra * FLUID_STRETCH_ABSORB
      canvasWidth = Math.min(canvasWidth, maxCanvasWidth)
    }
  } else if (mode === 'adapt') {
    scale = Math.min(sx, sy)
    canvasWidth = DESIGN_WIDTH
  } else {
    scale = Math.min(sx, sy)
    canvasWidth = DESIGN_WIDTH
  }

  if (mode !== 'cover' && safeInset) {
    scale *= 0.998
  }

  return { scale, canvasWidth, canvasHeight }
}

export function useScreenScale(options: ScreenScaleOptions = {}) {
  const { mode = 'contain', safeInset = false } = options
  const screenStore = useScreenStore()
  const scale = ref(1)
  const canvasWidth = ref(DESIGN_WIDTH)
  const canvasHeight = ref(DESIGN_HEIGHT)
  let rafId = 0

  function applyScale() {
    const { w, h } = getViewportSize()
    const result = computeScreenScale(w, h, mode, safeInset)
    scale.value = result.scale
    canvasWidth.value = result.canvasWidth
    canvasHeight.value = result.canvasHeight
    screenStore.setScale(result.scale)
  }

  function updateScale() {
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(applyScale)
  }

  onMounted(() => {
    updateScale()
    window.addEventListener('resize', updateScale)
    window.visualViewport?.addEventListener('resize', updateScale)
    window.addEventListener('orientationchange', updateScale)
    document.addEventListener('fullscreenchange', updateScale)
  })

  onUnmounted(() => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', updateScale)
    window.visualViewport?.removeEventListener('resize', updateScale)
    window.removeEventListener('orientationchange', updateScale)
    document.removeEventListener('fullscreenchange', updateScale)
  })

  const scaleStyle = computed(() => ({
    transform: `scale(${scale.value})`,
  }))

  const canvasStyle = computed(() => ({
    width: `${canvasWidth.value}px`,
    height: `${canvasHeight.value}px`,
  }))

  return {
    scale,
    canvasWidth,
    canvasHeight,
    scaleStyle,
    canvasStyle,
    designWidth: DESIGN_WIDTH,
    designHeight: DESIGN_HEIGHT,
  }
}
