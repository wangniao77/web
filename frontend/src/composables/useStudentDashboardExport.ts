import type { Ref } from 'vue'
import { usePageExport } from '@/composables/usePageExport'
import { dashboardToExcelSheets } from '@/utils/studentDashboardExport'
import type { StudentDashboardVM } from '@/types/student/view'

/** 学生子页一键注册：把当前 dashboard 导出为多工作表 Excel。 */
export function useStudentDashboardExport(
  title: string,
  dashboard: Ref<StudentDashboardVM | null | undefined>,
) {
  usePageExport(() => {
    const d = dashboard.value
    if (!d) throw new Error('页面数据尚未加载完成')
    return {
      title,
      studentId: d.profile.studentId,
      sheets: dashboardToExcelSheets(d),
    }
  })
}
