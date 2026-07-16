/**
 * 学生端 GPA 详情 · 共享数据层 统一导出
 *
 * 方便两个二级页面（gpa-detail / gpa-semester）一处引用：
 *   import { gpaDetailService } from '../_shared/gpa-data'
 */

export * from './types'
export * from './utils'
export * from './adapter'
export * from './service'
export { mockGpaDetail } from './mock'
