import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentUrl = new URL('../src/components/student/template/StudentKanbanCarousel.vue', import.meta.url)
const source = await readFile(componentUrl, 'utf8')

function styleBlock(selector) {
  const start = source.indexOf(`${selector} {`)
  assert.notEqual(start, -1, `Missing selector: ${selector}`)
  const next = source.indexOf(`\n.`, start + selector.length + 2)
  return source.slice(start, next === -1 ? source.length : next)
}

test('development cards keep content and actions in non-overlapping grid rows', () => {
  assert.match(styleBlock('.development-card'), /grid-template-rows:\s*auto minmax\(0, 1fr\) auto;/)
  assert.match(styleBlock('.development-card__action'), /min-height:\s*34px;/)
})

test('academic and quality content can shrink without painting over adjacent rows', () => {
  assert.match(styleBlock('.academic-body'), /overflow:\s*hidden;/)
  assert.match(styleBlock('.quality-body'), /overflow:\s*hidden;/)
  assert.match(styleBlock('.academic-kpi'), /overflow:\s*hidden;/)
  assert.match(styleBlock('.quality-panels'), /overflow:\s*hidden;/)
})

test('quality metrics use one stable row so the full ledger fits above its action', () => {
  assert.match(
    styleBlock('.development-card--quality .development-metrics.development-metrics--quality'),
    /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\);/,
  )
  assert.match(
    styleBlock('.quality-body'),
    /grid-template-rows:\s*50px minmax\(80px, 1fr\) 32px;/,
  )
  assert.match(styleBlock('.quality-panel li'), /text-overflow:\s*ellipsis;/)
  assert.match(styleBlock('.quality-panel li::before'), /border-radius:\s*50%;/)
  assert.match(source, /<li[^>]+:title="item"[^>]*>\{\{ item \}\}<\/li>/)
})

test('career and graduation cards reserve one explicit row for every content block', () => {
  for (const selector of ['.development-card--career', '.development-card--graduation']) {
    assert.match(
      styleBlock(selector),
      /grid-template-rows:\s*auto 88px minmax\(60px, 1fr\) 34px 34px;/,
    )
  }
  assert.match(
    styleBlock('.development-card--career .development-metrics.development-metrics--pair'),
    /height:\s*88px;/,
  )
  assert.match(styleBlock('.career-matches'), /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/)
  assert.match(styleBlock('.graduation-tasks'), /grid-template-rows:\s*repeat\(2, minmax\(0, 1fr\)\);/)
  assert.match(
    styleBlock('.development-card--graduation .development-insight p'),
    /white-space:\s*nowrap;/,
  )
})

test('academic overview uses its available space for the primary GPA visual', () => {
  assert.match(
    styleBlock('.academic-body'),
    /grid-template-columns:\s*minmax\(145px, 0\.82fr\) minmax\(0, 1\.18fr\);/,
  )
  assert.match(styleBlock('.gpa-gauge'), /svg \{ width:\s*96px; height:\s*96px;/)
  assert.match(styleBlock('.academic-hero__note'), /min-height:\s*34px;/)
  assert.match(styleBlock('.academic-hero__note'), /font-size:\s*14px;/)
})

test('quality overview limits long awards and sends the remainder to details', () => {
  assert.match(source, /const visibleQualityHighlights = computed\(\(\) => qualityHighlights\.value\.slice\(0, 2\)\)/)
  assert.match(source, /const hiddenQualityCount = computed\(\(\) => Math\.max\(0, qualityHighlights\.value\.length - 2\)\)/)
  assert.match(source, /v-for="\(item, idx\) in visibleQualityHighlights"/)
  assert.match(source, /另有 \{\{ hiddenQualityCount \}\} 项，进入详情查看/)
  assert.match(styleBlock('.quality-panel li'), /font-size:\s*13px;/)
  assert.match(styleBlock('.quality-panel__more'), /font-size:\s*12px !important;/)
})
