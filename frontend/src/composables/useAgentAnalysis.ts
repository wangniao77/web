import { computed, ref, watch, type Ref } from 'vue'
import { analyzePage } from '@/api/agent/services'
import type { AgentAnalyzeContextDTO } from '@/types/agent/api'
import type { AgentAnalysisVM } from '@/types/agent/view'

export interface UseAgentAnalysisOptions {
  /** 页面是否激活（例如当前 Tab）；false 时不自动请求 */
  enabled?: Ref<boolean> | boolean
  /** 是否在 context 就绪后自动分析 */
  auto?: boolean
}

/**
 * 二级详情页通用 Agent 分析钩子。
 * 其他页面：传入对应 pageKey + summarySnapshot 即可复用。
 */
export function useAgentAnalysis(
  context: Ref<AgentAnalyzeContextDTO | null>,
  options: UseAgentAnalysisOptions = {},
) {
  const analysis = ref<AgentAnalysisVM | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const sessionId = computed(() => analysis.value?.sessionId || '')

  const enabledRef = computed(() => {
    const e = options.enabled
    if (e == null) return true
    return typeof e === 'boolean' ? e : e.value
  })

  async function run(refresh = false) {
    const ctx = context.value
    if (!ctx || !enabledRef.value) return

    loading.value = true
    error.value = null
    try {
      analysis.value = await analyzePage({
        context: ctx,
        sessionId: refresh ? undefined : analysis.value?.sessionId,
        refresh,
      })
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : '分析失败'
    } finally {
      loading.value = false
    }
  }

  function refresh() {
    return run(true)
  }

  if (options.auto !== false) {
    watch(
      [context, enabledRef],
      (current, previous) => {
        const [ctx, on] = current
        const prevCtx = previous?.[0]
        const prevOn = previous?.[1]
        if (!on || !ctx) return
        const ctxChanged = JSON.stringify(ctx) !== JSON.stringify(prevCtx)
        if (ctxChanged || (on && !prevOn) || !analysis.value) {
          void run(false)
        }
      },
      { immediate: true, deep: true },
    )
  }

  return {
    analysis,
    loading,
    error,
    sessionId,
    run,
    refresh,
  }
}
