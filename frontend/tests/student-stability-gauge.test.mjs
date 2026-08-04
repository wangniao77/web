import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentUrl = new URL('../src/components/student/subpages/academic-detail/components/StabilityGauge.vue', import.meta.url)
const source = await readFile(componentUrl, 'utf8')

test('stability gauge presents one primary index with a surrounding telemetry rail', () => {
  assert.match(source, /class="stability-stage"/)
  assert.match(source, /class="stability-stage__telemetry[^\"]*"/)
  assert.match(source, /class="gauge-orbit gauge-orbit--outer"/)
  assert.match(source, /class="gauge-center__eyebrow">稳定指数<\/span>/)
})

test('stability metrics use a readable signal grid instead of five identical cards', () => {
  assert.match(source, /class="metrics metrics--signal"/)
  assert.match(source, /class="metric metric--primary"/)
  assert.match(source, /grid-template-columns:\s*1\.12fr repeat\(4, minmax\(0, 1fr\)\);/)
})

test('decorative motion respects reduced motion preferences', () => {
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(source, /\.gauge-orbit,\s*[\s\S]*?\.telemetry-scan/)
})

test('gauge keeps scale labels out of the central stability readout', () => {
  assert.match(source, /axisLabel:\s*\{\s*show:\s*false\s*\}/)
})
