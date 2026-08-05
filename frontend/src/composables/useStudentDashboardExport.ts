import type { Ref } from 'vue'
import { usePageExport } from '@/composables/usePageExport'
import { dashboardToExcelSheets } from '@/utils/studentDashboardExport'
import type { StudentDashboardVM } from '@/types/student/view'
import type { ExcelSheet } from '@/utils/exportExcel'

/**
 * 学生子页一键注册：把当前页数据导出为多工作表 Excel。
 *
 * - 默认（builder 省略）：导出整份驾驶舱 dashboard（dashboardToExcelSheets）。
 * - 传 builder：自定义导出内容（如只导出本页关心的字段、或独立数据）。
 *
 * @param title   导出文件名前缀（如「综合素养台账」）
 * @param data    页面主数据 Ref（dashboard 或独立数据），builder 内部读取
 * @param builder 根据数据生成工作表的函数；不传则使用 dashboardToExcelSheets
 */
export function useStudentDashboardExport<T>(
  title: string,
  data: Ref<T | null | undefined>,
  builder?: (data: T) => ExcelSheet[],
) {
  usePageExport(() => {
    const d = data.value
    if (!d) throw new Error('页面数据尚未加载完成')
    const sheets = builder
      ? builder(d)
      : (dashboardToExcelSheets(d as unknown as StudentDashboardVM))
    return {
      title,
      studentId: (d as { profile?: { studentId?: string } }).profile?.studentId,
      sheets,
    }
  })
}
