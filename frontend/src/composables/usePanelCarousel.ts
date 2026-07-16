import { onBeforeUnmount, onMounted, ref } from 'vue'

export function usePanelCarousel(slideCount: number, intervalMs = 10000) {
  const activeIndex = ref(0)
  const paused = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  function goTo(index: number) {
    if (slideCount <= 0) return
    activeIndex.value = ((index % slideCount) + slideCount) % slideCount
  }

  function next() {
    goTo(activeIndex.value + 1)
  }

  function pause() {
    paused.value = true
  }

  function resume() {
    paused.value = false
  }

  function start() {
    stop()
    if (slideCount <= 1) return
    timer = setInterval(() => {
      if (!paused.value) next()
    }, intervalMs)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  onMounted(start)
  onBeforeUnmount(stop)

  return { activeIndex, paused, goTo, next, pause, resume, start, stop }
}
