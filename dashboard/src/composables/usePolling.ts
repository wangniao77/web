import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  immediate = true,
) {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      data.value = await fetcher()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  let timer: ReturnType<typeof setInterval> | null = null

  function start() {
    if (immediate) load()
    timer = setInterval(load, intervalMs)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  onMounted(start)
  onUnmounted(stop)

  watch(
    () => intervalMs,
    () => {
      stop()
      start()
    },
  )

  return { data, loading, error, reload: load }
}
