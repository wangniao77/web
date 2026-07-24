/** 将表格数据导出为 Excel 可打开的 SpreadsheetML（.xls），无第三方依赖。 */

export type ExcelSheet = {
  name: string
  headers: string[]
  rows: Array<Array<string | number | null | undefined>>
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function cellXml(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '<Cell><Data ss:Type="String"></Data></Cell>'
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`
  }
  return `<Cell><Data ss:Type="String">${escapeXml(String(value))}</Data></Cell>`
}

function sheetXml(sheet: ExcelSheet): string {
  const safeName = escapeXml(sheet.name.slice(0, 31) || 'Sheet1')
  const headerRow = `<Row>${sheet.headers.map((h) => cellXml(h)).join('')}</Row>`
  const bodyRows = sheet.rows
    .map((row) => `<Row>${sheet.headers.map((_, i) => cellXml(row[i])).join('')}</Row>`)
    .join('')
  return `
  <Worksheet ss:Name="${safeName}">
    <Table>${headerRow}${bodyRows}</Table>
  </Worksheet>`
}

export function buildExcelXml(sheets: ExcelSheet[]): string {
  const list = sheets.length ? sheets : [{ name: 'Sheet1', headers: ['提示'], rows: [['暂无数据']] }]
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
${list.map(sheetXml).join('\n')}
</Workbook>`
}

export function downloadExcel(filename: string, sheets: ExcelSheet[]): void {
  const xml = buildExcelXml(sheets)
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safe = filename.replace(/[\\/:*?"<>|]+/g, '_').replace(/\.xlsx?$/i, '')
  a.href = url
  a.download = `${safe}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

export function stampFilename(prefix: string, studentId?: string): string {
  const d = new Date()
  const stamp = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
    '-',
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
  ].join('')
  return [prefix, studentId || '', stamp].filter(Boolean).join('_')
}
