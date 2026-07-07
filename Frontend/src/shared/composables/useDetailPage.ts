import { onMounted, ref, watch } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useRoute } from 'vue-router'

export interface DetailPageOptions<T, TParams extends Record<string, string>> {
  fetch: (params: TParams) => Promise<T>
  paramKeys: (keyof TParams & string)[]
}

function pickParams(route: RouteLocationNormalizedLoaded, keys: string[]): Record<string, string> {
  return keys.reduce<Record<string, string>>((acc, key) => {
    const value = route.params[key]
    acc[key] = Array.isArray(value) ? value[0] ?? '' : String(value ?? '')
    return acc
  }, {})
}

export function useDetailPage<T, TParams extends Record<string, string> = Record<string, string>>(
  options: DetailPageOptions<T, TParams>,
) {
  const route = useRoute()
  const data = ref<T | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const params = pickParams(route, options.paramKeys) as TParams
      data.value = await options.fetch(params)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  watch(
    () => options.paramKeys.map((key) => route.params[key]),
    load,
  )

  return { data, loading, error, reload: load }
}
