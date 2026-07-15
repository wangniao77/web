/**
 * 学生端"学分完成率"系列页面 · 数据服务
 *
 * 共享给：
 * - credit-progress/ 概览页
 * - training-plan/ 培养方案对照表
 */
import { createService } from '@/api/createService'
import { adaptCreditProgress } from './adapter'
import { mockCreditProgress } from './mock'
import type { CreditProgressVM } from './types'

export interface CreditProgressParams {
  studentId?: string
}

const fetchCreditProgress = createService<CreditProgressParams | undefined, CreditProgressVM>({
  mock: () => adaptCreditProgress(mockCreditProgress),
  fetch: async (params) => {
    // 真实接口预留
    // const id = params?.studentId || 'default'
    // const res = await studentCreditApi.getProgress(id)
    // return adaptCreditProgress(res.data.data)
    return adaptCreditProgress(mockCreditProgress)
  },
})

export const creditProgressService = {
  fetchProgress: fetchCreditProgress,
}
