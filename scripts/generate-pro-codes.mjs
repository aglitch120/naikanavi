#!/usr/bin/env node
/**
 * iwor PRO アクティベーションコード生成スクリプト
 * 
 * 使い方:
 *   node scripts/generate-pro-codes.mjs --plan pro_1y --count 10
 *   node scripts/generate-pro-codes.mjs --plan pro_2y --count 5
 *   node scripts/generate-pro-codes.mjs --plan pro_3y --count 5
 * 
 * 出力:
 *   - コンソール: 生のコード一覧（BOOTH商品に貼り付け用）
 *   - lib/pro-codes-generated.json: ハッシュ一覧（コードに埋め込み用）
 */

import { createHash, randomBytes } from 'crypto'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '../lib/pro-codes-generated.json')

// ── コード生成 ──
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 紛らわしい文字を除外（0/O/I/1）

function generateCode() {
  const bytes = randomBytes(12)
  const segments = []
  for (let i = 0; i < 3; i++) {
    let seg = ''
    for (let j = 0; j < 4; j++) {
      seg += CHARSET[bytes[i * 4 + j] % CHARSET.length]
    }
    segments.push(seg)
  }
  return `IWOR-${segments[0]}-${segments[1]}-${segments[2]}`
}

function hashCode(code) {
  return createHash('sha256').update(code.toUpperCase().trim()).digest('hex')
}

// ── メイン ──
const args = process.argv.slice(2)
const planIdx = args.indexOf('--plan')
const countIdx = args.indexOf('--count')

const plan = planIdx !== -1 ? args[planIdx + 1] : 'pro_1y'
const count = countIdx !== -1 ? parseInt(args[countIdx + 1], 10) : 10

if (!['pro_1y', 'pro_2y', 'pro_3y'].includes(plan)) {
  console.error('Error: --plan must be pro_1y, pro_2y, or pro_3y')
  process.exit(1)
}

const durationDays = { pro_1y: 365, pro_2y: 730, pro_3y: 1095 }

// 既存データ読み込み
let existing = { codes: [] }
if (existsSync(OUTPUT_PATH)) {
  existing = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'))
}

// 新規コード生成
const newCodes = []
const newHashes = []
for (let i = 0; i < count; i++) {
  const code = generateCode()
  const hash = hashCode(code)
  newCodes.push(code)
  newHashes.push({
    hash,
    plan,
    durationDays: durationDays[plan],
    createdAt: new Date().toISOString(),
    used: false,
  })
}

// 統合して保存
existing.codes = [...existing.codes, ...newHashes]
existing.updatedAt = new Date().toISOString()
writeFileSync(OUTPUT_PATH, JSON.stringify(existing, null, 2))

// コンソール出力
console.log(`\n✅ ${count}件の ${plan} コードを生成しました\n`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📋 以下をBOOTH購入完了メッセージにコピー:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
newCodes.forEach((code, i) => {
  console.log(`  ${i + 1}. ${code}`)
})
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`\nハッシュ保存先: ${OUTPUT_PATH}`)
console.log(`合計コード数: ${existing.codes.length}`)
