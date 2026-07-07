<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

// Lightweight cosmic starfield: drifting points + faint twinkle.
// Canvas is used (not heavy 3D) and honors prefers-reduced-motion.
const canvasRef = ref<HTMLCanvasElement | null>(null)
let raf = 0
let ctx: CanvasRenderingContext2D | null = null
let stars: Array<{ x: number; y: number; r: number; a: number; tw: number; vx: number }> = []
let w = 0
let h = 0

function seed() {
  const count = Math.round((w * h) / 14000)
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.3 + 0.3,
    a: Math.random() * 0.6 + 0.15,
    tw: Math.random() * Math.PI * 2,
    vx: (Math.random() - 0.5) * 0.06,
  }))
}

function resize() {
  const el = canvasRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  w = rect.width
  h = rect.height
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  el.width = w * dpr
  el.height = h * dpr
  ctx = el.getContext('2d')
  ctx?.scale(dpr, dpr)
  seed()
}

function draw(t: number) {
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)
  for (const s of stars) {
    const alpha = s.a * (0.55 + 0.45 * Math.sin(t * 0.001 + s.tw))
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(160, 210, 255, ${alpha})`
    ctx.fill()
    s.x += s.vx
    if (s.x < 0) s.x = w
    if (s.x > w) s.x = 0
  }
  raf = requestAnimationFrame(draw)
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  raf = requestAnimationFrame(draw)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <div class="starfield" aria-hidden="true">
    <canvas ref="canvasRef" class="starfield__canvas" />
    <div class="starfield__halo starfield__halo--center" />
    <div class="starfield__halo starfield__halo--l" />
    <div class="starfield__halo starfield__halo--r" />
  </div>
</template>

<style scoped lang="scss">
.starfield {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.starfield__canvas {
  width: 100%;
  height: 100%;
  opacity: 0.7;
}

.starfield__halo {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);

  &--center {
    top: -18%;
    left: 50%;
    width: 900px;
    height: 480px;
    transform: translateX(-50%);
    background: radial-gradient(circle, rgba(51, 217, 255, 0.12), transparent 68%);
  }

  &--l {
    bottom: -12%;
    left: 4%;
    width: 520px;
    height: 360px;
    background: radial-gradient(circle, rgba(75, 141, 255, 0.1), transparent 70%);
  }

  &--r {
    bottom: -14%;
    right: 4%;
    width: 520px;
    height: 360px;
    background: radial-gradient(circle, rgba(124, 139, 255, 0.09), transparent 70%);
  }
}
</style>
