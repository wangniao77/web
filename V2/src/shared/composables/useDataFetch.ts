import { onMounted, ref } from 'vue'

export interface DataFetchState<T> {
  data: ReturnType<typeof ref<T | null>>
  loading: ReturnType<typeof ref<boolean>>
  error: ReturnType<typeof ref<string | null>>
  execute: () => Promise<void>
}

export function useDataFetch<T>(fetcher: () => Promise<T>) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function execute() {
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

  onMounted(() => {
    void execute()
  })

  return { data, loading, error, execute }
}

export function useParallelDataFetch<T extends readonly (() => Promise<unknown>)[]>(
  fetchers: T,
) {
  const loading = ref(true)
  const error = ref<string | null>(null)
  const results = ref<unknown[]>([])

  async function execute() {
    loading.value = true
    error.value = null
    try {
      results.value = await Promise.all(fetchers.map((fn) => fn()))
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void execute()
  })

  return { results, loading, error, execute }
}
