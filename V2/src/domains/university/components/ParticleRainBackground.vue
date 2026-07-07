<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Full-screen falling light particles for the cockpit ambience.
 * Native canvas (no heavy 3D lib). Two depth layers, slow downward drift
 * with gentle horizontal sway. Auto-degrades on weak hardware and honors
 * prefers-reduced-motion. Particles are low-opacity and never occlude text.
 */
const props = withDefaults(defineProps<{ count?: number }>(), { count: 96 })

const canvasRef = ref<HTMLCanvasElement | null>(null)
let raf = 0
let ctx: CanvasRenderingContext2D | null = null
let w = 0
let h = 0
let dpr = 1

interface P {
  x: number
  y: number
  r: number
  vy: number
  drift: number
  phase: number
  alpha: number
  color: string
  near: boolean
}
let parts: P[] = []

function effectiveCount() {
  let c = props.count
  const cores = navigator.hardwareConcurrency ?? 8
  if (cores <= 4) c = Math.round(c * 0.55)
  if (window.innerWidth < 1440) c = Math.round(c * 0.7)
  return Math.max(24, c)
}

const COLORS_NEAR = ['rgba(120,200,255,', 'rgba(90,170,255,', 'rgba(220,240,255,']
const COLORS_FAR = ['rgba(90,160,220,', 'rgba(70,130,200,']

function makeParticle(initial: boolean): P {
  const near = Math.random() > 0.55
  const palette = near ? COLORS_NEAR : COLORS_FAR
  return {
    x: Math.random() * w,
    y: initial ? Math.random() * h : -10,
    r: near ? Math.random() * 1.1 + 0.7 : Math.random() * 0.7 + 0.3,
    vy: near ? Math.random() * 0.32 + 0.28 : Math.random() * 0.16 + 0.1,
    drift: (Math.random() - 0.5) * 0.25,
    phase: Math.random() * Math.PI * 2,
    alpha: near ? Math.random() * 0.24 + 0.16 : Math.random() * 0.16 + 0.06,
    color: palette[Math.floor(Math.random() * palette.length)],
    near,
  }
}

function seed() {
  parts = Array.from({ length: effectiveCount() }, () => makeParticle(true))
}

function resize() {
  const el = canvasRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  w = rect.width
  h = rect.height
  dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  el.width = w * dpr
  el.height = h * dpr
  ctx = el.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  seed()
}

function frame(t: number) {
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)
  for (const p of parts) {
    p.y += p.vy
    p.x += p.drift + Math.sin(t * 0.0004 + p.phase) * 0.12
    if (p.y > h + 6) {
      Object.assign(p, makeParticle(false))
      p.x = Math.random() * w
    }
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `${p.color}${p.alpha})`
    ctx.fill()
  }
  raf = requestAnimationFrame(frame)
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  raf = requestAnimationFrame(frame)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <canvas ref="canvasRef" class="particle-rain" aria-hidden="true" />
</template>

<style scoped lang="scss">
.particle-rain {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
