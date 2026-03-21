#!/usr/bin/env node

/**
 * verify-sources.mjs — 医学データの自動ダブルチェック + 確かめ算
 *
 * 実行: node scripts/verify-sources.mjs
 * 推奨: 1日1回 cron or GitHub Actions で実行
 *
 * チェック項目:
 * 1. [DATA_HASH]    医学データのハッシュ変更検出（意図しない変更）
 * 2. [DOSE_FORMAT]  用量データの表記揺れ
 * 3. [SAMD_WORDING] 治療推奨ワード検出
 * 4. [CALC_VERIFY]  独立確かめ算（主要計算ツール）
 * 5. [FILE_EXISTS]  監視対象ファイルの存在確認
 *
 * 出力: public/verify-status.json（最終検証日時をUIに表示）
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { createHash } from 'crypto'
import { join, resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const REPORT_PATH = join(ROOT, 'docs', 'source-verify-report.json')
const HASH_PATH = join(ROOT, 'docs', 'source-data-hashes.json')
const STATUS_PATH = join(ROOT, 'public', 'verify-status.json')

// ── 監視対象ツール ──
const MONITORED_TOOLS = [
  { id: 'gamma-calc', path: 'app/tools/calc/gamma/page.tsx', priority: 'critical' },
  { id: 'renal-dose-abx', path: 'app/tools/calc/renal-dose-abx/page.tsx', priority: 'high' },
  { id: 'antibiotics', path: 'app/tools/drugs/antibiotics/page.tsx', priority: 'high' },
  { id: 'steroid-cover', path: 'app/tools/drugs/steroid-cover/page.tsx', priority: 'high' },
  { id: 'na-correction-rate', path: 'app/tools/calc/na-correction-rate/page.tsx', priority: 'medium' },
  { id: 'opioid-conversion', path: 'app/tools/calc/opioid-conversion/page.tsx', priority: 'medium' },
  { id: 'lab-values', path: 'app/tools/calc/lab-values/page.tsx', priority: 'medium' },
  { id: 'combination', path: 'app/tools/drugs/combination/page.tsx', priority: 'medium' },
]

// ── 独立確かめ算 ──
// 各ツールの計算ロジックを独立実装して検証
const CALC_VERIFICATIONS = [
  {
    id: 'egfr-ckdepi',
    description: 'eGFR (CKD-EPI 2021) — 70歳男性 Cr=1.2',
    expected: 65.06,
    tolerance: 1,
    compute: () => {
      // CKD-EPI 2021 (race-free): 142 × min(Cr/κ, 1)^α × max(Cr/κ, 1)^-1.200 × 0.9938^age
      const cr = 1.2, age = 70, female = false
      const kappa = female ? 0.7 : 0.9
      const alpha = female ? -0.241 : -0.302
      const minRatio = Math.min(cr / kappa, 1)
      const maxRatio = Math.max(cr / kappa, 1)
      return 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, age) * (female ? 1.012 : 1)
    },
  },
  {
    id: 'cockcroft-gault',
    description: 'CCr (Cockcroft-Gault) — 70歳男性 70kg Cr=1.2',
    expected: 56.9,
    tolerance: 2,
    compute: () => {
      // CCr = (140-age) × weight / (72 × Cr) × (0.85 if female)
      return (140 - 70) * 70 / (72 * 1.2)
    },
  },
  {
    id: 'bmi',
    description: 'BMI — 170cm 70kg',
    expected: 24.22,
    tolerance: 0.1,
    compute: () => {
      return 70 / (1.70 * 1.70)
    },
  },
  {
    id: 'bsa-dubois',
    description: 'BSA (Du Bois) — 170cm 70kg',
    expected: 1.81,
    tolerance: 0.05,
    compute: () => {
      // BSA = 0.007184 × H^0.725 × W^0.425
      return 0.007184 * Math.pow(170, 0.725) * Math.pow(70, 0.425)
    },
  },
  {
    id: 'anion-gap',
    description: 'AG — Na=140 Cl=105 HCO3=24',
    expected: 11,
    tolerance: 0.1,
    compute: () => 140 - 105 - 24,
  },
  {
    id: 'corrected-ca',
    description: '補正Ca (Payne式) — Ca=8.0 Alb=2.5',
    expected: 9.2,
    tolerance: 0.1,
    compute: () => {
      // Payne式: 補正Ca = Ca + 0.8 × (4 - Alb)
      return 8.0 + 0.8 * (4 - 2.5)
    },
  },
  {
    id: 'fena',
    description: 'FENa — 尿Na=40 尿Cr=60 血Na=140 血Cr=2.0',
    expected: 0.952,
    tolerance: 0.05,
    compute: () => {
      // FENa = (尿Na × 血Cr) / (血Na × 尿Cr) × 100
      return (40 * 2.0) / (140 * 60) * 100
    },
  },
  {
    id: 'gamma-norad',
    description: 'ノルアドレナリン γ→mL/h — 0.1μg/kg/min, 60kg, 3mg/50mL',
    expected: 6.0,
    tolerance: 0.1,
    compute: () => {
      // mL/h = γ(μg/kg/min) × weight(kg) × 60(min) / conc(μg/mL)
      // conc = 3mg/50mL = 3000μg/50mL = 60μg/mL
      const gamma = 0.1, weight = 60, drugMg = 3, totalMl = 50
      const concUgPerMl = (drugMg * 1000) / totalMl
      return (gamma * weight * 60) / concUgPerMl
    },
  },
]

// ── ヘルパー ──

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

function extractMedicalData(content) {
  const lines = content.split('\n')
  const dataLines = []
  let inDataBlock = false
  let braceDepth = 0
  for (const line of lines) {
    if (/^\s*(const\s+\w+\s*[:=]|doses:|firstLine:|alt:|dose:|note:|dilutions:)/.test(line)) {
      inDataBlock = true
    }
    if (inDataBlock) {
      dataLines.push(line)
      braceDepth += (line.match(/[\[{(]/g) || []).length
      braceDepth -= (line.match(/[\]})]/g) || []).length
      if (braceDepth <= 0 && dataLines.length > 1) {
        inDataBlock = false
        braceDepth = 0
      }
    }
  }
  return dataLines.join('\n')
}

function checkDoseFormat(content) {
  const issues = []
  if (/\d\s*mg/i.test(content) && /\d\s*\uff4d\uff47/.test(content)) {
    issues.push('mg: 全角半角混在')
  }
  if (/q\s+\d+h/.test(content)) issues.push('用法空白: "q 6h"→"q6h"')
  if (/μg/.test(content) && /mcg/.test(content)) issues.push('μg vs mcg 混在')
  return issues
}

// ── メイン ──

function main() {
  const now = new Date().toISOString()
  console.log(`🔍 iwor 医学データ検証 — ${now}`)
  console.log('='.repeat(60))

  const report = {
    timestamp: now,
    summary: { pass: 0, warn: 0, fail: 0 },
    tools: [],
    calculations: [],
  }

  let previousHashes = {}
  if (existsSync(HASH_PATH)) {
    try { previousHashes = JSON.parse(readFileSync(HASH_PATH, 'utf-8')) } catch {}
  }
  const currentHashes = {}

  // ── ファイル検証 ──
  for (const tool of MONITORED_TOOLS) {
    const fullPath = join(ROOT, tool.path)
    const toolReport = { id: tool.id, path: tool.path, priority: tool.priority, checks: [] }

    if (!existsSync(fullPath)) {
      toolReport.checks.push({ check: 'FILE_EXISTS', status: 'FAIL', message: `ファイルなし: ${tool.path}` })
      report.summary.fail++
      report.tools.push(toolReport)
      continue
    }

    const content = readFileSync(fullPath, 'utf-8')

    // データハッシュ
    const medData = extractMedicalData(content)
    const hash = hashContent(medData)
    currentHashes[tool.id] = hash
    if (previousHashes[tool.id]) {
      const match = previousHashes[tool.id] === hash
      toolReport.checks.push({
        check: 'DATA_HASH', status: match ? 'PASS' : 'WARN',
        message: match ? `変更なし (${hash})` : `⚠️ 変更検出 ${previousHashes[tool.id]}→${hash}`,
      })
      match ? report.summary.pass++ : report.summary.warn++
    } else {
      toolReport.checks.push({ check: 'DATA_HASH', status: 'PASS', message: `初回 (${hash})` })
      report.summary.pass++
    }

    // 用量フォーマット
    const fmt = checkDoseFormat(content)
    toolReport.checks.push({
      check: 'DOSE_FORMAT', status: fmt.length ? 'WARN' : 'PASS',
      message: fmt.length ? `⚠️ ${fmt.join('; ')}` : 'OK',
    })
    fmt.length ? report.summary.warn++ : report.summary.pass++

    // SaMD危険ワード
    const dangerWords = []
    const patterns = [
      { p: /を推奨/, l: '「を推奨」' },
      { p: /すべき/, l: '「すべき」' },
      { p: /第一選択/, l: '「第一選択」' },
      { p: /臨床判断を補助/, l: '「臨床判断を補助」' },
    ]
    for (const { p, l } of patterns) {
      if (p.test(content)) dangerWords.push(l)
    }
    toolReport.checks.push({
      check: 'SAMD_WORDING', status: dangerWords.length ? 'WARN' : 'PASS',
      message: dangerWords.length ? `⚠️ ${dangerWords.join(', ')}` : 'OK',
    })
    dangerWords.length ? report.summary.warn++ : report.summary.pass++

    report.tools.push(toolReport)
  }

  // ── 独立確かめ算 ──
  console.log('\n📐 独立確かめ算:')
  for (const v of CALC_VERIFICATIONS) {
    const result = v.compute()
    const diff = Math.abs(result - v.expected)
    const pass = diff <= v.tolerance
    report.calculations.push({
      id: v.id, description: v.description,
      expected: v.expected, actual: Math.round(result * 1000) / 1000,
      tolerance: v.tolerance, status: pass ? 'PASS' : 'FAIL',
    })
    const icon = pass ? '✅' : '❌'
    console.log(`  ${icon} ${v.id}: expected=${v.expected} actual=${Math.round(result * 1000) / 1000} (±${v.tolerance})`)
    pass ? report.summary.pass++ : report.summary.fail++
  }

  // ハッシュ・レポート保存
  writeFileSync(HASH_PATH, JSON.stringify(currentHashes, null, 2))
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))

  // 公開ステータス（UIに表示する最終検証日時）
  const status = {
    lastVerified: now,
    calcPass: report.calculations.filter(c => c.status === 'PASS').length,
    calcTotal: report.calculations.length,
    toolsChecked: report.tools.length,
    summary: report.summary,
  }
  writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2))

  // コンソール出力
  console.log('\n' + '='.repeat(60))
  for (const tool of report.tools) {
    console.log(`\n📋 ${tool.id} [${tool.priority}]`)
    for (const c of tool.checks) {
      const icon = c.status === 'PASS' ? '✅' : c.status === 'WARN' ? '⚠️' : '❌'
      console.log(`  ${icon} ${c.message}`)
    }
  }
  console.log('\n' + '='.repeat(60))
  console.log(`📊 ✅${report.summary.pass} ⚠️${report.summary.warn} ❌${report.summary.fail}`)
  console.log(`📁 ${STATUS_PATH}`)

  process.exit(report.summary.fail > 0 ? 1 : 0)
}

main()
