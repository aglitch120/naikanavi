/**
 * iwor スモークテスト
 * 実行: node tests/smoke.test.mjs
 *
 * 主要ページのファイル存在確認 + 設定ファイルの整合性チェック
 */

import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

let passed = 0
let failed = 0

function assert(name, condition) {
  if (condition) {
    passed++
    console.log(`  ✅ ${name}`)
  } else {
    failed++
    console.error(`  ❌ ${name}`)
  }
}

// ── 主要ルートの page.tsx 存在確認 ──
console.log('\n📄 主要ページ存在チェック')

const requiredPages = [
  'app/page.tsx',                     // ホーム
  'app/study/page.tsx',               // Study
  'app/tools/calc/egfr/page.tsx',     // eGFR計算（代表ツール）
  'app/matching/page.tsx',            // マッチング
  'app/josler/page.tsx',              // J-OSLER
  'app/journal/page.tsx',             // 論文フィード
  'app/presenter/page.tsx',           // プレゼン
  'app/shift/page.tsx',               // 当直シフト
  'app/money/page.tsx',               // マネー
  'app/pro/page.tsx',                 // PRO
  'app/about/page.tsx',               // About
]

for (const page of requiredPages) {
  assert(page, existsSync(resolve(root, page)))
}

// ── レイアウト / 設定ファイル ──
console.log('\n⚙️  設定ファイルチェック')

const requiredConfigs = [
  'app/layout.tsx',
  'lib/tools-config.ts',
  'lib/seo.ts',
  'public/manifest.json',
  'public/search-index.json',
  'next.config.mjs',
  'tailwind.config.js',
  'CLAUDE.md',
]

for (const cfg of requiredConfigs) {
  assert(cfg, existsSync(resolve(root, cfg)))
}

// ── tools-config.ts にツール定義が十分あるか ──
console.log('\n🔧 ツール設定チェック')

const toolsConfig = readFileSync(resolve(root, 'lib/tools-config.ts'), 'utf-8')
const toolCount = (toolsConfig.match(/slug:/g) || []).length
assert(`ツール数 >= 100 (実際: ${toolCount})`, toolCount >= 100)

// ── search-index.json がパース可能 ──
console.log('\n🔍 検索インデックスチェック')

try {
  const searchIndex = JSON.parse(readFileSync(resolve(root, 'public/search-index.json'), 'utf-8'))
  assert('search-index.json パース可能', Array.isArray(searchIndex) || typeof searchIndex === 'object')
  const indexSize = Array.isArray(searchIndex) ? searchIndex.length : Object.keys(searchIndex).length
  assert(`検索インデックス件数 >= 50 (実際: ${indexSize})`, indexSize >= 50)
} catch (e) {
  assert('search-index.json パース可能', false)
}

// ── docs/ 必須ファイル ──
console.log('\n📚 ドキュメントチェック')

const requiredDocs = [
  'docs/README.md',
  'docs/STRATEGY.md',
  'docs/PRODUCT.md',
  'docs/IMPLEMENTATION.md',
  'docs/DESIGN_SYSTEM.md',
  'docs/TODO.md',
  'docs/FEATURE_REQUESTS_v6.md',
]

for (const doc of requiredDocs) {
  assert(doc, existsSync(resolve(root, doc)))
}

// ── 結果 ──
console.log(`\n${'─'.repeat(40)}`)
console.log(`✅ ${passed} passed / ❌ ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
