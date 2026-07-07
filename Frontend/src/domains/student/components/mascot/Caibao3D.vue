<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import { buildCaibaoModel } from './buildCaibaoModel'

const props = withDefaults(
  defineProps<{
    size?: number
  }>(),
  {
    size: 100,
  },
)

const containerRef = ref<HTMLDivElement>()
let renderer: THREE.WebGLRenderer | null = null
let animationId = 0
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let mascot: THREE.Group | null = null
let eyes: THREE.Group[] = []
let clock: THREE.Clock | null = null
let resizeObserver: ResizeObserver | null = null

let nextBlinkAt = 2.5
let blinkStart = -1
const BLINK_DURATION = 0.14
const BLINK_INTERVAL_MIN = 2.8
const BLINK_INTERVAL_MAX = 5.5

function disposeObject3D(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      const material = child.material
      if (Array.isArray(material)) material.forEach((m) => m.dispose())
      else material.dispose()
    }
  })
}

function updateBlink(t: number) {
  if (blinkStart < 0 && t >= nextBlinkAt) {
    blinkStart = t
  }

  let scaleY = 1
  if (blinkStart >= 0) {
    const progress = (t - blinkStart) / BLINK_DURATION
    if (progress >= 1) {
      blinkStart = -1
      nextBlinkAt = t + BLINK_INTERVAL_MIN + Math.random() * (BLINK_INTERVAL_MAX - BLINK_INTERVAL_MIN)
    } else if (progress < 0.45) {
      scaleY = 1 - (progress / 0.45) * 0.92
    } else {
      scaleY = 0.08 + ((progress - 0.45) / 0.55) * 0.92
    }
  }

  for (const eye of eyes) {
    eye.scale.y = scaleY
  }
}

function initScene() {
  const container = containerRef.value
  if (!container) return

  const width = props.size
  const height = props.size

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100)
  camera.position.set(0, 0.2, 3.4)
  camera.lookAt(0, 0.05, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0xffffff, 0.9)
  scene.add(ambient)

  const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.15)
  keyLight.position.set(2.5, 4, 3)
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0x9ecfff, 0.45)
  fillLight.position.set(-3, 0.5, 2)
  scene.add(fillLight)

  const rimLight = new THREE.DirectionalLight(0xf0c040, 0.3)
  rimLight.position.set(0, 3, -4)
  scene.add(rimLight)

  const model = buildCaibaoModel()
  mascot = model.root
  eyes = model.eyes
  scene.add(mascot)

  clock = new THREE.Clock()

  const animate = () => {
    animationId = requestAnimationFrame(animate)
    const t = clock!.getElapsedTime()
    updateBlink(t)
    renderer!.render(scene!, camera!)
  }
  animate()
}

function cleanup() {
  cancelAnimationFrame(animationId)
  resizeObserver?.disconnect()
  resizeObserver = null

  if (mascot) {
    disposeObject3D(mascot)
    mascot = null
  }
  eyes = []

  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
    renderer = null
  }

  scene = null
  camera = null
  clock = null
}

onMounted(() => {
  initScene()

  resizeObserver = new ResizeObserver(() => {
    if (!renderer || !camera || !containerRef.value) return
    const { clientWidth, clientHeight } = containerRef.value
    if (clientWidth === 0 || clientHeight === 0) return
    camera.aspect = clientWidth / clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(clientWidth, clientHeight)
  })
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(cleanup)
</script>

<template>
  <div
    ref="containerRef"
    class="caibao-3d"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-label="财宝 3D 吉祥物"
    role="img"
  />
</template>

<style scoped lang="scss">
.caibao-3d {
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  background: radial-gradient(circle at 50% 60%, rgba(240, 192, 64, 0.1) 0%, transparent 70%);

  :deep(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
}
</style>
