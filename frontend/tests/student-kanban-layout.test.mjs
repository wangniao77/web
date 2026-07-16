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

test('career card reserves one explicit row for every content block', () => {
  assert.match(
    styleBlock('.development-card--career'),
    /grid-template-rows:\s*auto 82px minmax\(56px, 1fr\) 32px 32px;/,
  )
  assert.match(
    styleBlock('.development-card--career .development-metrics.development-metrics--pair'),
    /height:\s*82px;/,
  )
})

test('graduation overview is summarized inside academic card and details stay secondary', () => {
  assert.doesNotMatch(source, /development-card development-card--graduation/)
  assert.match(source, /class="academic-graduation-brief"/)
  assert.match(source, /毕业审核/)
  assert.match(source, /@click="emit\('open', 'graduation'\)"/)
})

test('three cards move on one track while two cards remain visible', () => {
  assert.match(source, /class="development-track"/)
  assert.match(source, /const carouselCards = \[/)
  assert.match(source, /\{ id: 'academic-loop', type: 'academic' \}/)
  assert.match(source, /\{ id: 'quality-loop', type: 'quality' \}/)
  assert.match(source, /function advanceCarousel\(\)/)
  assert.match(source, /translateX\(calc\(\$\{trackIndex\} \* \(-50% - 8px\)\)\)/)
  assert.match(
    styleBlock('.development-track'),
    /grid-template-columns:\s*repeat\(5, calc\(\(100% - 16px\) \/ 2\)\);/,
  )
  assert.match(styleBlock('.development-track'), /transition:\s*transform 0\.65s/)
  assert.doesNotMatch(source, /development-slide--single/)
})

test('carousel state tabs share the switcher width equally', () => {
  assert.match(styleBlock('.dev-switch'), /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/)
  assert.doesNotMatch(source, /class="dev-switch__jump"/)
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
