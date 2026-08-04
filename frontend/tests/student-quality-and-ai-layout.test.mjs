import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const qualityUrl = new URL('../src/components/student/template/StudentKanbanCarousel.vue', import.meta.url)
const aiUrl = new URL('../src/components/student/subpages/ai-portrait/index.vue', import.meta.url)
const [qualitySource, aiSource] = await Promise.all([
  readFile(qualityUrl, 'utf8'),
  readFile(aiUrl, 'utf8'),
])

test('quality ledger keeps category navigation and award records legible on the overview screen', () => {
  assert.match(qualitySource, /\.quality-nav__item[\s\S]*?font-size:\s*17px;/)
  assert.match(qualitySource, /\.quality-item[\s\S]*?font-size:\s*17px;/)
  assert.match(qualitySource, /\.quality-shortboard-tip[\s\S]*?font-size:\s*16px;/)
})

test('AI deep analysis keeps its three-pane cockpit on desktop widths', () => {
  assert.match(aiSource, /@media \(max-width: 1280px\)[\s\S]*?\.cockpit-grid\s*\{\s*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/)
  assert.match(aiSource, /@media \(max-width: 760px\)[\s\S]*?\.cockpit-grid,[\s\S]*?\.opp-timeline__inner\s*\{\s*grid-template-columns:\s*1fr;/)
})

test('AI cockpit condenses the decision into short signals and one priority action', () => {
  assert.match(aiSource, /class="ai-decision__signals"/)
  assert.match(aiSource, /class="ai-decision__next"/)
  assert.doesNotMatch(aiSource, /<ul class="ai-decision__list">/)
})

test('AI action plan limits first-view tasks and opportunity radar uses a compact grid', () => {
  assert.match(aiSource, /v-for="\(t, i\) in g\.items\.slice\(0, 2\)"/)
  assert.match(aiSource, /\.opp-timeline__inner\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/)
})

test('AI cockpit fills score and judgement panels with compact capability telemetry', () => {
  assert.match(aiSource, /class="ability-pulse"/)
  assert.match(aiSource, /v-for="ability in abilities\.slice\(0, 4\)"/)
  assert.match(aiSource, /class="ai-decision__focus"/)
  assert.match(aiSource, /v-for="ability in abilities\.slice\(0, 3\)"/)
})

test('AI cockpit gives key metrics a larger type scale and a stronger score visual', () => {
  assert.match(aiSource, /\.cockpit-ring-score\s*\{[\s\S]*?width:\s*198px;[\s\S]*?height:\s*198px;/)
  assert.match(aiSource, /\.ability-pulse[\s\S]*?font-size:\s*19px;/)
  assert.match(aiSource, /@keyframes cockpitGlow/)
})
