import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  new URL('../src/components/student/template/StudentIdentityCard.vue', import.meta.url),
  'utf8',
)

test('identity card groups rich profile content into a two-column upper region', () => {
  assert.match(source, /class="sid__upper"/)
  assert.match(source, /class="sid__context"/)
  assert.match(source, /\.sid__upper\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1\.2fr\)\s+minmax\(250px,\s*0\.8fr\)/)
  assert.match(source, /\.sid__context\s*\{[\s\S]*?grid-template-rows:/)
})

test('recent activity and archive links share one compact utility row', () => {
  assert.match(source, /class="sid__utility-row"/)
  assert.match(source, /\.sid__utility-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(220px,\s*0\.72fr\)/)
})

test('identity card reserves stable rows for status and warnings', () => {
  assert.match(source, /\.sid\s*\{[\s\S]*?display:\s*grid/)
  assert.match(source, /grid-template-rows:\s*minmax\(0,\s*1fr\)\s+auto\s+auto\s+auto/)
})

test('narrow identity column keeps profile fields readable in a single list', () => {
  assert.match(source, /\.sid__grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  assert.match(source, /\.sid__grid\s*\{[\s\S]*?grid-template-columns:\s*58px\s+minmax\(0,\s*1fr\)/)
  assert.match(source, /\.sid__avatar\s*\{[\s\S]*?width:\s*96px/)
})
