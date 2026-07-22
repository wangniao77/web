<script setup lang="ts">
// 真正的词云：按权重缩放字号 + 阿基米德螺旋布局 + AABB 碰撞检测 + 密铺填充整个区域
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface CloudWord {
  name: string
  weight: number
}

const props = withDefaults(
  defineProps<{
    words: CloudWord[]
    colors?: string[]
  }>(),
  {
    colors: () => ['#22d3ee', '#7dd3fc', '#fbbf24', '#34d399', '#a78bfa', '#f472b6', '#fca5a5'],
  },
)

const wrap = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let placed: Array<{
  word: CloudWord
  x: number
  y: number
  w: number
  h: number
  font: number
  color: string
  rot: number
}> = []
let hoverIdx = -1
let ro: ResizeObserver | null = null

const FONT_STACK = '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif'

function collides(l: number, t: number, r: number, b: number): boolean {
  for (const p of placed) {
    const pl = p.x - p.w / 2
    const pr = p.x + p.w / 2
    const pt = p.y - p.h / 2
    const pb = p.y + p.h / 2
    if (!(r < pl || l > pr || b < pt || t > pb)) return true
  }
  return false
}

// 沿阿基米德螺旋搜索第一个不重叠且未越界的位置
function findPos(tw: number, th: number, rot: number, cx: number, cy: number, W: number, H: number) {
  let bw: number
  let bh: number
  if (rot === 0) {
    bw = tw
    bh = th
  } else {
    bw = th
    bh = tw
  }
  const pad = 2
  const step = 3.5
  const maxR = Math.hypot(W, H)
  for (let i = 0; i < 900; i++) {
    const angle = 0.35 * i
    const radius = step * 0.5 * i
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    const left = x - bw / 2 - pad
    const right = x + bw / 2 + pad
    const top = y - bh / 2 - pad
    const bottom = y + bh / 2 + pad
    if (left < 0 || right > W || top < 0 || bottom > H) {
      if (radius > maxR) return null
      continue
    }
    if (!collides(left, top, right, bottom)) return { x, y }
  }
  return null
}

function layout() {
  const el = wrap.value
  const cv = canvasEl.value
  if (!el || !cv) return
  const W = el.clientWidth
  const H = el.clientHeight
  if (W <= 0 || H <= 0) return
  const dpr = window.devicePixelRatio || 1
  cv.width = Math.round(W * dpr)
  cv.height = Math.round(H * dpr)
  cv.style.width = W + 'px'
  cv.style.height = H + 'px'
  ctx = cv.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  const list = [...props.words].sort((a, b) => b.weight - a.weight)
  const maxW = Math.max(...list.map((w) => w.weight))
  const minW = Math.min(...list.map((w) => w.weight))
  const maxFont = Math.min(W / 3.2, 60)
  const minFont = 14
  placed = []
  const cx = W / 2
  const cy = H / 2

  for (const wd of list) {
    const t = maxW === minW ? 1 : (wd.weight - minW) / (maxW - minW)
    const font = Math.round(minFont + t * (maxFont - minFont))
    // 短词水平，长词有概率竖排以增强密铺感
    const rot = wd.name.length <= 2 || Math.random() < 0.55 ? 0 : Math.PI / 2
    const color = props.colors[placed.length % props.colors.length]
    ctx.font = `800 ${font}px ${FONT_STACK}`
    const m = ctx.measureText(wd.name)
    const tw = m.width
    const th = (m.actualBoundingBoxAscent || font * 0.7) + (m.actualBoundingBoxDescent || font * 0.3)
    const pos = findPos(tw, th, rot, cx, cy, W, H)
    if (!pos) continue
    placed.push({ word: wd, x: pos.x, y: pos.y, w: tw, h: th, font, color, rot })
  }
  hoverIdx = -1
  draw()
}

function draw() {
  const el = wrap.value
  const cv = canvasEl.value
  if (!ctx || !el || !cv) return
  const W = el.clientWidth
  const H = el.clientHeight
  ctx.clearRect(0, 0, W, H)
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  for (let i = 0; i < placed.length; i++) {
    const p = placed[i]
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rot)
    ctx.font = `800 ${p.font}px ${FONT_STACK}`
    if (i === hoverIdx) {
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = p.color
      ctx.shadowBlur = 14
    } else {
      ctx.fillStyle = p.color
    }
    ctx.fillText(p.word.name, 0, 0)
    ctx.restore()
  }
}

function onMove(e: MouseEvent) {
  const cv = canvasEl.value
  if (!cv) return
  const rect = cv.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  let hit = -1
  for (let i = 0; i < placed.length; i++) {
    const p = placed[i]
    if (mx >= p.x - p.w / 2 && mx <= p.x + p.w / 2 && my >= p.y - p.h / 2 && my <= p.y + p.h / 2) {
      hit = i
      break
    }
  }
  if (hit !== hoverIdx) {
    hoverIdx = hit
    draw()
    cv.style.cursor = hit >= 0 ? 'pointer' : 'default'
  }
}

function onLeave() {
  if (hoverIdx !== -1) {
    hoverIdx = -1
    draw()
  }
}

watch(
  () => props.words,
  () => nextTick(layout),
)

onMounted(() => {
  nextTick(layout)
  ro = new ResizeObserver(() => layout())
  if (wrap.value) ro.observe(wrap.value)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})
</script>

<template>
  <div ref="wrap" class="wordcloud">
    <canvas ref="canvasEl" @mousemove="onMove" @mouseleave="onLeave" />
  </div>
</template>

<style scoped>
.wordcloud {
  position: relative;
  width: 100%;
  height: 100%;

  canvas {
    display: block;
  }
}
</style>
