import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentUrl = new URL('../src/components/student/subpages/academic-detail/components/SupportTrajectory.vue', import.meta.url)
const source = await readFile(componentUrl, 'utf8')

test('support trajectory gives long intervention notes two readable columns', () => {
  assert.match(source, /class="timeline-grid"/)
  assert.match(source, /\.timeline-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/)
})

test('support trajectory becomes one column before cards become too narrow', () => {
  assert.match(source, /@media \(max-width: 900px\)/)
  assert.match(source, /\.timeline-grid\s*\{\s*grid-template-columns:\s*1fr;/)
})
