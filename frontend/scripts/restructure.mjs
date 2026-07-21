/**
 * 将 domains/shared/core/app/portal 结构迁移为标准 Vue 3 目录结构
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(__dirname, '../src')

/** @type {Record<string, string>} */
const MOVE_MAP = {}

function mapDir(fromRel, toRel) {
  const from = path.join(SRC, fromRel)
  if (!fs.existsSync(from)) return
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name)
    const rel = path.join(fromRel, entry.name).replace(/\\/g, '/')
    const destRel = path.join(toRel, entry.name).replace(/\\/g, '/')
    if (entry.isDirectory()) {
      mapDir(rel, destRel)
    } else {
      MOVE_MAP[rel] = destRel
    }
  }
}

// 入口
MOVE_MAP['app/main.ts'] = 'main.ts'
MOVE_MAP['app/App.vue'] = 'App.vue'
MOVE_MAP['portal/PortalView.vue'] = 'views/PortalView.vue'

// core → api / types
MOVE_MAP['core/api/client.ts'] = 'api/client.ts'
MOVE_MAP['core/service/createService.ts'] = 'api/createService.ts'
MOVE_MAP['core/types/common.ts'] = 'types/common.ts'

// shared → 标准目录
mapDir('shared/composables', 'composables')
mapDir('shared/components/charts', 'components/charts')
mapDir('shared/layouts', 'layouts')
mapDir('shared/utils', 'utils')

// domains → 按业务拆分
for (const domain of ['college', 'university', 'student']) {
  mapDir(`domains/${domain}/views`, `views/${domain}`)
  mapDir(`domains/${domain}/components`, `components/${domain}`)
  mapDir(`domains/${domain}/modules`, `components/${domain}/modules`)
  mapDir(`domains/${domain}/api`, `api/${domain}`)
  mapDir(`domains/${domain}/services`, `api/${domain}/services`)
  mapDir(`domains/${domain}/adapters`, `api/${domain}/adapters`)
  mapDir(`domains/${domain}/mock`, `mock/${domain}`)
  mapDir(`domains/${domain}/types`, `types/${domain}`)
  mapDir(`domains/${domain}/constants`, `constants/${domain}`)
  mapDir(`domains/${domain}/styles`, `styles/${domain}`)
}

// university charts
mapDir('domains/university/charts', 'components/university/charts')

// assets 保持
if (fs.existsSync(path.join(SRC, 'assets'))) {
  // already at src/assets
}

/** 按长度降序，避免短路径先替换导致错误 */
const IMPORT_REPLACEMENTS = [
  ['@/domains/college/views/', '@/views/college/'],
  ['@/domains/university/views/', '@/views/university/'],
  ['@/domains/student/views/', '@/views/student/'],
  ['@/domains/college/modules/', '@/components/college/modules/'],
  ['@/domains/university/modules/', '@/components/university/modules/'],
  ['@/domains/student/modules/', '@/components/student/modules/'],
  ['@/domains/college/components/', '@/components/college/'],
  ['@/domains/university/components/', '@/components/university/'],
  ['@/domains/university/charts/', '@/components/university/charts/'],
  ['@/domains/student/components/', '@/components/student/'],
  ['@/domains/college/services/', '@/api/college/services/'],
  ['@/domains/university/services/', '@/api/university/services/'],
  ['@/domains/student/services/', '@/api/student/services/'],
  ['@/domains/college/adapters/', '@/api/college/adapters/'],
  ['@/domains/university/adapters/', '@/api/university/adapters/'],
  ['@/domains/student/adapters/', '@/api/student/adapters/'],
  ['@/domains/college/api/', '@/api/college/'],
  ['@/domains/university/api/', '@/api/university/'],
  ['@/domains/student/api/', '@/api/student/'],
  ['@/domains/college/mock/', '@/mock/college/'],
  ['@/domains/university/mock/', '@/mock/university/'],
  ['@/domains/student/mock/', '@/mock/student/'],
  ['@/domains/college/types/', '@/types/college/'],
  ['@/domains/university/types/', '@/types/university/'],
  ['@/domains/student/types/', '@/types/student/'],
  ['@/domains/college/constants/', '@/constants/college/'],
  ['@/domains/university/constants/', '@/constants/university/'],
  ['@/domains/student/constants/', '@/constants/student/'],
  ['@/domains/college/styles/', '@/styles/college/'],
  ['@/domains/university/styles/', '@/styles/university/'],
  ['@/domains/student/styles/', '@/styles/student/'],
  ['@/core/service/createService', '@/api/createService'],
  ['@/core/api/client', '@/api/client'],
  ['@/core/types/common', '@/types/common'],
  ['@/shared/composables/', '@/composables/'],
  ['@/shared/components/charts/', '@/components/charts/'],
  ['@/shared/layouts/', '@/layouts/'],
  ['@/shared/utils/', '@/utils/'],
  ['@/portal/PortalView.vue', '@/views/PortalView.vue'],
  ['@/app/App.vue', '@/App.vue'],
  ['@/app/main.ts', '@/main.ts'],
]

/** @type {string[]} */
const DELETE_PATHS = [
  'shared/components/screen-legacy',
  'shared/components/ScreenPanel.vue',
  'shared/components/PlaceholderView.vue',
  'shared/components/metrics',
  'shared/composables/useDetailPage.ts',
  'shared/composables/useDataFetch.ts',
  'app',
  'portal',
  'core',
  'domains',
  'shared',
]

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function moveFiles() {
  for (const [fromRel, toRel] of Object.entries(MOVE_MAP)) {
    const from = path.join(SRC, fromRel)
    const to = path.join(SRC, toRel)
    if (!fs.existsSync(from)) {
      console.warn(`skip missing: ${fromRel}`)
      continue
    }
    ensureDir(to)
    fs.renameSync(from, to)
    console.log(`moved: ${fromRel} -> ${toRel}`)
  }
}

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkFiles(full, acc)
    else if (/\.(ts|vue|scss)$/.test(entry.name)) acc.push(full)
  }
  return acc
}

function updateImports() {
  const files = walkFiles(SRC)
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8')
    let changed = false
    for (const [from, to] of IMPORT_REPLACEMENTS) {
      if (content.includes(from)) {
        content = content.split(from).join(to)
        changed = true
      }
    }
    if (changed) {
      fs.writeFileSync(file, content, 'utf8')
      console.log(`updated imports: ${path.relative(SRC, file)}`)
    }
  }
}

function removePath(rel) {
  const full = path.join(SRC, rel)
  if (!fs.existsSync(full)) return
  fs.rmSync(full, { recursive: true, force: true })
  console.log(`deleted: ${rel}`)
}

function cleanupEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) cleanupEmptyDirs(full)
  }
  if (dir !== SRC && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir)
    console.log(`removed empty: ${path.relative(SRC, dir)}`)
  }
}

moveFiles()
updateImports()
for (const rel of DELETE_PATHS) removePath(rel)
cleanupEmptyDirs(SRC)
console.log('restructure done')
