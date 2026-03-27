#!/usr/bin/env node
/**
 * recalc-hensachi.mjs — 偏差値を「本気倍率」ベースに再計算
 *
 * 新公式:
 *   本気倍率 = (applicants × honmeiIndex) / capacity
 *   honmeiIndexがない場合: 本気倍率 = applicants / capacity (従来通り)
 *   偏差値 = 50 + 10 × z(本気倍率)
 *
 * これにより大学病院の「滑り止め志望」バイアスが除去され、
 * 大学と市中を同じスケールで比較できる。
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const filePath = resolve(ROOT, 'app/matching/hospitals-data.ts')
let content = readFileSync(filePath, 'utf-8')

// Extract all hospital objects as text lines
const lines = content.split('\n')
const dataLines = []
const headerLines = []
const footerLines = []

let inData = false
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export const HOSPITALS')) {
    headerLines.push(...lines.slice(0, i + 1))
    inData = true
    continue
  }
  if (inData && lines[i].trim() === ']') {
    footerLines.push(...lines.slice(i))
    inData = false
    continue
  }
  if (inData) {
    dataLines.push(lines[i])
  }
}

// Parse each hospital line into an object
function parseLine(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('{')) return null
  // Remove trailing comma
  const json = trimmed.replace(/,\s*$/, '')
  try {
    return eval(`(${json})`)
  } catch {
    return null
  }
}

const hospitals = dataLines.map(parseLine).filter(Boolean)
console.log(`Parsed ${hospitals.length} hospitals`)

// Calculate median honmeiIndex for fallback
const validHonmei = hospitals.filter(h => h.honmeiIndex != null && h.honmeiIndex > 0).map(h => h.honmeiIndex).sort((a, b) => a - b)
const medianHonmei = validHonmei[Math.floor(validHonmei.length / 2)]
console.log(`honmeiIndex: ${validHonmei.length}件有効 / ${hospitals.length}件中, 中央値=${medianHonmei}`)
const noHonmei = hospitals.filter(h => h.honmeiIndex == null || h.honmeiIndex === 0)
console.log(`honmeiIndexなし: ${noHonmei.length}件 (中央値${medianHonmei}で代替)`)

// Calculate 本気倍率 for each hospital
for (const h of hospitals) {
  if (h.capacity === 0) {
    h._honkiBairitsu = 0
    continue
  }
  const hi = (h.honmeiIndex != null && h.honmeiIndex > 0) ? h.honmeiIndex : medianHonmei
  // 本気倍率 = (志望者 × 第1志望率) / 定員
  h._honkiBairitsu = (h.applicants * hi) / h.capacity
}

// Log-transform for more natural distribution (倍率 is log-normal)
for (const h of hospitals) {
  h._logHonki = h._honkiBairitsu > 0 ? Math.log(h._honkiBairitsu) : -3 // floor for 0
}
const logValues = hospitals.map(h => h._logHonki)
const mean = logValues.reduce((a, b) => a + b, 0) / logValues.length
const std = Math.sqrt(logValues.reduce((a, b) => a + (b - mean) ** 2, 0) / logValues.length)

console.log(`本気倍率: mean=${mean.toFixed(3)}, std=${std.toFixed(3)}`)

// Calculate new hensachi from log-transformed z-scores
for (const h of hospitals) {
  const z = std > 0 ? (h._logHonki - mean) / std : 0
  h.hensachi = Math.round((50 + 10 * z) * 10) / 10
  // Soft clamp: min 30, max 80 (偏差値 range that users understand)
  h.hensachi = Math.max(30, Math.min(80, h.hensachi))
}

// Detect university hospitals from name
const uniPatterns = ['大学病院', '大学附属', '大学医学部', '大学付属', '医科大学']
for (const h of hospitals) {
  h.isUniversity = uniPatterns.some(p => h.name.includes(p) || h.program.includes(p))
}

// Deduplicate: pick each hospital's main program (largest capacity) for ranking
// Sub-programs (小児科専門, 産婦人科専門 etc.) inherit the main program's rank
const byName = {}
for (const h of hospitals) {
  if (!byName[h.name] || h.capacity > byName[h.name].capacity) {
    byName[h.name] = h
  }
}
const mainPrograms = Object.values(byName)
const sorted = mainPrograms.sort((a, b) => b.hensachi - a.hensachi || b._honkiBairitsu - a._honkiBairitsu)
const rankByName = {}
for (let i = 0; i < sorted.length; i++) {
  rankByName[sorted[i].name] = i + 1
}
// Assign rank to all programs (including sub-programs)
for (const h of hospitals) {
  h.popularityRank = rankByName[h.name] || 9999
}
console.log(`ランキング: ${mainPrograms.length}病院（${hospitals.length}プログラムから本体のみ抽出）`)

// Print top 50 for verification
console.log('\n=== TOP 50 ===')
for (let i = 0; i < 50; i++) {
  const h = sorted[i]
  const uni = h.isUniversity ? '🏫' : '🏥'
  console.log(`${i + 1}. ${uni} ${h.name} (${h.prefecture}) — 偏差値${h.hensachi} | 本気倍率${h._honkiBairitsu.toFixed(2)} | 倍率${h.popularity} | honmei=${h.honmeiIndex || 'N/A'}`)
}

// Print university vs community stats
const uniHospitals = sorted.filter(h => h.isUniversity)
const comHospitals = sorted.filter(h => !h.isUniversity)
const top50Uni = sorted.slice(0, 50).filter(h => h.isUniversity).length
const top50Com = sorted.slice(0, 50).filter(h => !h.isUniversity).length
console.log(`\n=== 大学 vs 市中 (top50) ===`)
console.log(`大学: ${top50Uni}件, 市中: ${top50Com}件`)
console.log(`大学平均偏差値: ${(uniHospitals.reduce((a, h) => a + h.hensachi, 0) / uniHospitals.length).toFixed(1)}`)
console.log(`市中平均偏差値: ${(comHospitals.reduce((a, h) => a + h.hensachi, 0) / comHospitals.length).toFixed(1)}`)

// Now rewrite the file
function serializeHospital(h) {
  const parts = [
    `id: ${h.id}`,
    `name: '${h.name}'`,
    `prefecture: '${h.prefecture}'`,
    `programId: '${h.programId}'`,
    `program: '${h.program}'`,
    `capacity: ${h.capacity}`,
    `matched: ${h.matched}`,
    `vacancy: ${h.vacancy}`,
    `applicants: ${h.applicants}`,
    `matchRate: ${h.matchRate}`,
    `popularity: ${h.popularity}`,
  ]
  if (h.avgMatchRate3y != null) parts.push(`avgMatchRate3y: ${h.avgMatchRate3y}`)
  if (h.honmeiIndex != null) parts.push(`honmeiIndex: ${h.honmeiIndex}`)
  if (h.popularityTrend != null) parts.push(`popularityTrend: ${h.popularityTrend}`)
  parts.push(`hensachi: ${h.hensachi}`)
  if (h.anabaScore != null) parts.push(`anabaScore: ${h.anabaScore}`)
  if (h.risingScore != null) parts.push(`risingScore: ${h.risingScore}`)
  if (h.stabilityScore != null) parts.push(`stabilityScore: ${h.stabilityScore}`)
  parts.push(`popularityRank: ${h.popularityRank}`)
  if (h.firstChoiceTrend != null) {
    const fct = JSON.stringify(h.firstChoiceTrend).replace(/"/g, "'")
    parts.push(`firstChoiceTrend: ${fct}`)
  }
  if (h.isUniversity) parts.push(`isUniversity: true`)
  return `  { ${parts.join(', ')} },`
}

const newDataLines = hospitals.map(serializeHospital)
const output = [...headerLines, ...newDataLines, ...footerLines].join('\n')
writeFileSync(filePath, output, 'utf-8')
console.log('\n✅ hospitals-data.ts updated with 本気倍率-based 偏差値')
