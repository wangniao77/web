import type { ExcelSheet } from '@/utils/exportExcel'

/** 从页面 DOM 中收集 table，用于未单独注册导出数据源的页面。 */
export function collectDomTables(root: ParentNode = document): ExcelSheet[] {
  const tables = Array.from(root.querySelectorAll('table'))
  const sheets: ExcelSheet[] = []

  tables.forEach((table, index) => {
    const headerCells = table.querySelectorAll('thead th, thead td')
    let headers = Array.from(headerCells).map((el) => (el.textContent || '').trim())

    const bodyRows = Array.from(table.querySelectorAll('tbody tr'))
    const allRows = bodyRows.length
      ? bodyRows
      : Array.from(table.querySelectorAll('tr')).slice(headers.length ? 0 : 1)

    if (!headers.length && allRows.length) {
      const first = allRows[0]
      headers = Array.from(first.querySelectorAll('th, td')).map((el) => (el.textContent || '').trim())
      const dataRows = allRows.slice(1)
      sheets.push({
        name: `表格${index + 1}`,
        headers: headers.length ? headers : ['列1'],
        rows: dataRows.map((tr) =>
          Array.from(tr.querySelectorAll('td, th')).map((el) => (el.textContent || '').trim()),
        ),
      })
      return
    }

    if (!headers.length) {
      headers = ['内容']
    }

    sheets.push({
      name: `表格${index + 1}`,
      headers,
      rows: allRows.map((tr) =>
        Array.from(tr.querySelectorAll('td, th')).map((el) => (el.textContent || '').trim()),
      ),
    })
  })

  return sheets
}
