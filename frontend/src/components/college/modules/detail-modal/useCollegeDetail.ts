import { reactive, readonly } from 'vue'

/**
 * 学院驾驶舱「详情弹窗」全局状态（单例）。
 * 任何面板都可 import 后调用 openCollegeDetail，弹出 80% 屏幕的模态窗口，
 * 而非整页跳转，避免覆盖当前驾驶舱页面。
 */
export type CollegeDetailKind =
  | 'key-tasks'
  | 'high-potential'
  | 'high-potential-overview'
  | 'warning'
  | 'teaching'
  | 'research'
  | 'employment'

export interface CollegeDetailPayload {
  kind: CollegeDetailKind
  /** high-potential 用 moduleId；warning 用类别 type */
  id?: string
}

interface DetailState {
  visible: boolean
  kind: CollegeDetailKind | null
  id: string | null
}

const state = reactive<DetailState>({
  visible: false,
  kind: null,
  id: null,
})

export function openCollegeDetail(payload: CollegeDetailPayload) {
  state.kind = payload.kind
  state.id = payload.id ?? null
  state.visible = true
}

export function closeCollegeDetail() {
  state.visible = false
}

export function useCollegeDetail() {
  return {
    state: readonly(state),
    openCollegeDetail,
    closeCollegeDetail,
  }
}
