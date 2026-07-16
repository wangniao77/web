/**
 * 学生端挂科详情 · 共享数据服务
 */
import { createService } from '@/api/createService'
import { adaptFailDetail } from './adapter'
import { mockFailDetail } from './mock'
import type { FailDetailVM } from './types'

export interface FailDetailParams {
  studentId?: string
}

const fetchFailDetail = createService<FailDetailParams | undefined, FailDetailVM>({
  mock: () => adaptFailDetail(mockFailDetail),
  fetch: async (_params) => {
    // 真实接口预留
    return adaptFailDetail(mockFailDetail)
  },
})

export const failDetailService = {
  fetchDetail: fetchFailDetail,
}
