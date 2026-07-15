/**
 * 学生端 GPA 详情 · 共享数据服务
 *
 * 复用全局 @/api/createService，自动根据 VITE_USE_MOCK 切换 mock/真实接口。
 * 真实接口未来可对接 /student/:id/gpa-detail。
 */
import { createService } from '@/api/createService'
import { adaptGpaDetail } from './adapter'
import { mockGpaDetail } from './mock'
import type { GpaDetailVM } from './types'

export interface GpaDetailParams {
  studentId?: string
}

const fetchGpaDetail = createService<GpaDetailParams | undefined, GpaDetailVM>({
  mock: () => adaptGpaDetail(mockGpaDetail),
  fetch: async (params) => {
    // 真实接口预留（暂时直接走 mock）
    // const id = params?.studentId || 'default'
    // const res = await studentGpaApi.getDetail(id)
    // return adaptGpaDetail(res.data.data)
    return adaptGpaDetail(mockGpaDetail)
  },
})

export const gpaDetailService = {
  fetchDetail: fetchGpaDetail,
}
