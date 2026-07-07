import type { AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types/common'

/** 从统一 ApiResponse 中取出业务数据，失败时抛出可读错误 */
export function unwrapApiData<T>(response: AxiosResponse<ApiResponse<T>>): T {
  const body = response.data
  if (!body || typeof body !== 'object') {
    throw new Error('接口响应格式异常')
  }
  if (body.code !== 0) {
    throw new Error(body.message || '接口返回失败')
  }
  if (body.data == null) {
    throw new Error('接口未返回数据')
  }
  return body.data
}
