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
 * contain：等比缩放，画布固定 1920×1080
 * adapt：同 contain（兼容别名）
 * fluid：等比缩放 + 画布扩展至铺满视口（无黑边）
 * cover：等比放大填满视口（可能裁切）
 */
export function computeScreenScale(
  w: number,
  h: number,
  mode: ScreenScaleMode = 'fluid',
  safeInset = false,
): ScreenScaleResult {
  const sx = w / DESIGN_WIDTH
  const sy = h / DESIGN_HEIGHT

  let scale: number
  let canvasWidth: number
  let canvasHeight: number

  if (mode === 'cover') {
    scale = Math.max(sx, sy)
    canvasWidth = DESIGN_WIDTH
    canvasHeight = DESIGN_HEIGHT
  } else if (mode === 'fluid') {
    // 统一缩放比 + 画布逻辑尺寸 = 视口 / scale，保证 scale × canvas = 视口，两侧/上下无黑边
    scale = Math.min(sx, sy)
    canvasWidth = w / scale
    canvasHeight = h / scale
  } else {
    scale = Math.min(sx, sy)
    canvasWidth = DESIGN_WIDTH
    canvasHeight = DESIGN_HEIGHT
  }

  if (mode !== 'cover' && safeInset) {
    scale *= 0.998
  }

  return { scale, canvasWidth, canvasHeight }
}

export function useScreenScale(options: ScreenScaleOptions = {}) {
  const { mode = 'fluid', safeInset = false } = options
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

  const wrapperStyle = computed(() => ({
    '--screen-scale': String(scale.value),
    '--canvas-width': `${canvasWidth.value}px`,
    '--canvas-height': `${canvasHeight.value}px`,
  }))

  return {
    scale,
    canvasWidth,
    canvasHeight,
    scaleStyle,
    canvasStyle,
    wrapperStyle,
    designWidth: DESIGN_WIDTH,
    designHeight: DESIGN_HEIGHT,
  }
}
