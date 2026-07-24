import { onBeforeUnmount, onMounted } from 'vue'
import { downloadExcel, stampFilename, type ExcelSheet } from '@/utils/exportExcel'

export type PageExportPayload = {
  /** 文件名前缀，如「学生总览」「综合素养台账」 */
  title: string
  studentId?: string
  sheets: ExcelSheet[]
}

type ExportHandler = () => PageExportPayload | Promise<PageExportPayload>

let activeHandler: ExportHandler | null = null

/** 当前页注册导出数据源；离开页面自动注销。 */
export function usePageExport(handler: ExportHandler) {
  onMounted(() => {
    activeHandler = handler
  })
  onBeforeUnmount(() => {
    if (activeHandler === handler) activeHandler = null
  })
}

export function hasPageExport(): boolean {
  return !!activeHandler
}

/** 导出当前页；无注册时抛出提示。 */
export async function exportActivePage(): Promise<void> {
  if (!activeHandler) {
    throw new Error('当前页面暂未配置导出数据')
  }
  const payload = await activeHandler()
  downloadExcel(stampFilename(payload.title, payload.studentId), payload.sheets)
}
