import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentUrl = new URL('../src/components/student/template/StudentAiAdviceCard.vue', import.meta.url)
const source = await readFile(componentUrl, 'utf8')

function styleBlock(selector) {
  const start = source.indexOf(`${selector} {`)
  assert.notEqual(start, -1, `Missing selector: ${selector}`)
  const next = source.indexOf(`\n.`, start + selector.length + 2)
  return source.slice(start, next === -1 ? source.length : next)
}

test('ai navigation tabs use stable columns and do not clip labels', () => {
  assert.match(styleBlock('.navi__tabs'), /display:\s*grid;/)
  assert.match(styleBlock('.navi__tabs'), /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/)
  assert.match(styleBlock('.navi__tabs'), /overflow:\s*visible;/)
  assert.match(styleBlock('.navi__tabs'), /button \{/)
  assert.match(styleBlock('.navi__tabs'), /min-height:\s*38px;/)
})

test('ai panel presents readable content without a cramped inner scrollbar', () => {
  assert.match(source, /return text\.length > 132/)
  assert.match(styleBlock('.navi__panel'), /overflow:\s*hidden;/)
  assert.match(styleBlock('.navi-card__summary'), /-webkit-line-clamp:\s*4;/)
})
