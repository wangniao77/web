import { onMounted, onUnmounted } from 'vue'
import { useScreenStore } from '@/stores/screen'

export interface AutoRefreshOptions {
  enabled?: boolean
  pauseOnHidden?: boolean
}

export function useAutoRefresh(fetcher: () => void | Promise<void>, options: AutoRefreshOptions = {}) {
  const { enabled = true, pauseOnHidden = true } = options
  const screenStore = useScreenStore()
  let timer: ReturnType<typeof setInterval> | null = null

  function start() {
    if (!enabled) return
    stop()
    timer = setInterval(() => {
      void fetcher()
    }, screenStore.refreshInterval)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function handleVisibility() {
    if (!pauseOnHidden) return
    if (document.visibilityState === 'hidden') {
      stop()
    } else {
      start()
    }
  }

  onMounted(() => {
    start()
    if (pauseOnHidden) {
      document.addEventListener('visibilitychange', handleVisibility)
    }
  })

  onUnmounted(() => {
    stop()
    if (pauseOnHidden) {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  })

  return { start, stop }
}
