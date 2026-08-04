import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentUrl = new URL('../src/components/student/subpages/academic-detail/components/MajorPositionChart.vue', import.meta.url)
const source = await readFile(componentUrl, 'utf8')

test('major comparison uses a metric matrix instead of a long single column', () => {
  assert.match(source, /class="position-metrics"/)
  assert.match(source, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
})

test('major comparison uses paired insight cards to fill the lower visual area', () => {
  assert.match(source, /class="position-insights"/)
  assert.match(source, /class="position-insight position-insight--good"/)
  assert.match(source, /class="position-insight position-insight--warn"/)
})

test('major comparison safely stacks its layout on small screens', () => {
  assert.match(source, /@media \(max-width: 760px\)/)
  assert.match(source, /\.major-pos\s*\{\s*grid-template-columns:\s*1fr;/)
})
