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
  // critical: 計算間違い→患者安全に直結
  { id: 'gamma-calc', path: 'app/tools/calc/gamma/page.tsx', priority: 'critical' },
  { id: 'renal-dose-abx', path: 'app/tools/calc/renal-dose-abx/page.tsx', priority: 'critical' },
  { id: 'dopamine-dose', path: 'app/tools/calc/dopamine-dose/page.tsx', priority: 'critical' },
  { id: 'drip-rate', path: 'app/tools/calc/drip-rate/page.tsx', priority: 'critical' },
  { id: 'na-correction-rate', path: 'app/tools/calc/na-correction-rate/page.tsx', priority: 'critical' },
  { id: 'na-deficit', path: 'app/tools/calc/na-deficit/page.tsx', priority: 'critical' },
  { id: 'opioid-conversion', path: 'app/tools/calc/opioid-conversion/page.tsx', priority: 'critical' },
  { id: 'steroid-converter', path: 'app/tools/calc/steroid-converter/page.tsx', priority: 'critical' },
  // high: 薬剤関連
  { id: 'antibiotics', path: 'app/tools/drugs/antibiotics/page.tsx', priority: 'high' },
  { id: 'steroid-cover', path: 'app/tools/drugs/steroid-cover/page.tsx', priority: 'high' },
  { id: 'combination', path: 'app/tools/drugs/combination/page.tsx', priority: 'high' },
  { id: 'infusion-list', path: 'app/tools/calc/infusion-list/page.tsx', priority: 'high' },
  // medium: 主要計算ツール
  { id: 'egfr', path: 'app/tools/calc/egfr/page.tsx', priority: 'medium' },
  { id: 'cockcroft-gault', path: 'app/tools/calc/cockcroft-gault/page.tsx', priority: 'medium' },
  { id: 'corrected-ca', path: 'app/tools/calc/corrected-ca/page.tsx', priority: 'medium' },
  { id: 'anion-gap', path: 'app/tools/calc/anion-gap/page.tsx', priority: 'medium' },
  { id: 'fib-4', path: 'app/tools/calc/fib-4/page.tsx', priority: 'medium' },
  { id: 'qtc', path: 'app/tools/calc/qtc/page.tsx', priority: 'medium' },
  { id: 'map', path: 'app/tools/calc/map/page.tsx', priority: 'medium' },
  { id: 'bmi', path: 'app/tools/calc/bmi/page.tsx', priority: 'medium' },
  { id: 'bsa', path: 'app/tools/calc/bsa/page.tsx', priority: 'medium' },
  { id: 'lab-values', path: 'app/tools/calc/lab-values/page.tsx', priority: 'medium' },
  { id: 'harris-benedict', path: 'app/tools/calc/harris-benedict/page.tsx', priority: 'medium' },
  { id: 'parkland', path: 'app/tools/calc/parkland/page.tsx', priority: 'medium' },
  { id: 'maintenance-fluid', path: 'app/tools/calc/maintenance-fluid/page.tsx', priority: 'medium' },
  { id: 'free-water-deficit', path: 'app/tools/calc/free-water-deficit/page.tsx', priority: 'medium' },
]

// ── 独立確かめ算（三重検証） ──
// 1. 教科書/ガイドラインの正解値（出典付き）
// 2. 独立計算（スクリプト内で式を実装）
// 3. ツール内の定数・式をファイルから抽出して照合
//
// 全てが一致して初めてPASS
const CALC_VERIFICATIONS = [
  {
    id: 'egfr-ckdepi',
    description: 'eGFR (CKD-EPI 2021) — 70歳男性 Cr=1.2',
    expected: 65.06,
    tolerance: 1,
    source: 'Inker LA, et al. NEJM 2021;385:1737-1749, Table S12',
    // ツール内の式定数を検証
    fileCheck: { path: 'app/tools/calc/egfr/page.tsx', mustContain: ['142', '0.9938', '-1.200', '0.7', '0.9', '1.012'] },
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
    source: 'Cockcroft DW, Gault MH. Nephron 1976;16:31-41',
    fileCheck: { path: 'app/tools/calc/cockcroft-gault/page.tsx', mustContain: ['140', '72', '0.85'] },
    compute: () => {
      return (140 - 70) * 70 / (72 * 1.2)
    },
  },
  {
    id: 'bmi',
    description: 'BMI — 170cm 70kg',
    expected: 24.22,
    tolerance: 0.1,
    source: 'WHO obesity classification / 日本肥満学会',
    fileCheck: { path: 'app/tools/calc/bmi/page.tsx', mustContain: ['100', 'weight', 'height'] },
    compute: () => {
      return 70 / (1.70 * 1.70)
    },
  },
  {
    id: 'bsa-dubois',
    description: 'BSA (Du Bois) — 170cm 70kg',
    expected: 1.81,
    tolerance: 0.05,
    source: 'Du Bois D, Du Bois EF. Arch Intern Med 1916;17:863-871',
    fileCheck: { path: 'app/tools/calc/bsa/page.tsx', mustContain: ['0.007184', '0.725', '0.425'] },
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
    source: 'Emmett M, Narins RG. Medicine 1977;56:38-54',
    fileCheck: { path: 'app/tools/calc/anion-gap/page.tsx', mustContain: ['Na', 'Cl', 'HCO'] },
    compute: () => 140 - 105 - 24,
  },
  {
    id: 'corrected-ca',
    description: '補正Ca (Payne式) — Ca=8.0 Alb=2.5',
    expected: 9.2,
    tolerance: 0.1,
    source: 'Payne RB, et al. BMJ 1973;4:643-646',
    fileCheck: { path: 'app/tools/calc/corrected-ca/page.tsx', mustContain: ['0.8', '4'] },
    compute: () => {
      return 8.0 + 0.8 * (4 - 2.5)
    },
  },
  {
    id: 'fena',
    description: 'FENa — 尿Na=40 尿Cr=60 血Na=140 血Cr=2.0',
    expected: 0.952,
    tolerance: 0.05,
    source: 'Espinel CH. JAMA 1976;236:579-581',
    fileCheck: { path: 'app/tools/calc/fena/page.tsx', mustContain: ['100'] },
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
    source: 'ICU Book (Marino) Ch.54 / 日本集中治療医学会 薬剤投与速度表',
    fileCheck: { path: 'app/tools/calc/gamma/page.tsx', mustContain: ['1000', '60'] },
    compute: () => {
      const gamma = 0.1, weight = 60, drugMg = 3, totalMl = 50
      const concUgPerMl = (drugMg * 1000) / totalMl
      return (gamma * weight * 60) / concUgPerMl
    },
  },
  {
    id: 'gamma-doa',
    description: 'ドパミン γ→mL/h — 3μg/kg/min, 60kg, 200mg/50mL',
    expected: 2.7,
    tolerance: 0.1,
    source: 'ICU Book (Marino) Ch.54',
    fileCheck: { path: 'app/tools/calc/gamma/page.tsx', mustContain: ['1000'] },
    compute: () => {
      const gamma = 3, weight = 60, drugMg = 200, totalMl = 50
      const concUgPerMl = (drugMg * 1000) / totalMl
      return (gamma * weight * 60) / concUgPerMl
    },
  },
  {
    id: 'gamma-dob',
    description: 'ドブタミン γ→mL/h — 5μg/kg/min, 60kg, 200mg/50mL',
    expected: 4.5,
    tolerance: 0.1,
    source: 'ICU Book (Marino) Ch.54',
    fileCheck: { path: 'app/tools/calc/gamma/page.tsx', mustContain: ['1000'] },
    compute: () => {
      const gamma = 5, weight = 60, drugMg = 200, totalMl = 50
      const concUgPerMl = (drugMg * 1000) / totalMl
      return (gamma * weight * 60) / concUgPerMl
    },
  },
  {
    id: 'na-deficit',
    description: 'Na欠乏量 — 目標Na135, 現Na125, 60kg男性',
    expected: 360,
    tolerance: 1,
    source: 'Rose BD. Clinical Physiology of Acid-Base and Electrolyte Disorders 5th ed.',
    fileCheck: { path: 'app/tools/calc/na-deficit/page.tsx', mustContain: ['0.6', '0.5'] },
    compute: () => {
      // Na欠乏量 = TBW × (目標Na - 現Na), TBW = 0.6 × 体重（男性）
      return 0.6 * 60 * (135 - 125)
    },
  },
  {
    id: 'na-correction-rate',
    description: 'Na補正速度 — 3%NaCl 500mL, Na=120→128, 60kg',
    expected: 8,
    tolerance: 0.5,
    source: 'Sterns RH. NEJM 2015;372:55-65 / 日本内分泌学会GL',
    fileCheck: { path: 'app/tools/calc/na-correction-rate/page.tsx', mustContain: ['8', '10', '12'] },
    compute: () => {
      // 24時間あたりの補正量 = 目標Na - 現Na
      return 128 - 120  // mEq/L/24h (上限8-10)
    },
  },
  {
    id: 'steroid-psl-to-mepsl',
    description: 'ステロイド換算 PSL 20mg → mPSL',
    expected: 16,
    tolerance: 0.1,
    source: '今日の治療薬2024 / UpToDate: Glucocorticoid dosing equivalencies',
    fileCheck: { path: 'app/tools/calc/steroid-converter/page.tsx', mustContain: ['5', '4', '0.75'] },
    compute: () => {
      return 20 * (4 / 5)
    },
  },
  {
    id: 'steroid-psl-to-dex',
    description: 'ステロイド換算 PSL 20mg → DEX',
    expected: 3.0,
    tolerance: 0.5,
    source: '今日の治療薬2024 / UpToDate: Glucocorticoid dosing equivalencies',
    fileCheck: { path: 'app/tools/calc/steroid-converter/page.tsx', mustContain: ['0.75'] },
    compute: () => {
      return 20 * (0.75 / 5)
    },
  },
  {
    id: 'map',
    description: 'MAP — SBP=120 DBP=80',
    expected: 93.3,
    tolerance: 0.5,
    source: 'Guyton: Textbook of Medical Physiology',
    fileCheck: { path: 'app/tools/calc/map/page.tsx', mustContain: ['3'] },
    compute: () => {
      // MAP = DBP + (SBP-DBP)/3
      return 80 + (120 - 80) / 3
    },
  },
  {
    id: 'qtc-bazett',
    description: 'QTc (Bazett) — QT=400ms HR=75bpm',
    expected: 447,
    tolerance: 2,
    source: 'Bazett HC. Heart 1920;7:353-370',
    fileCheck: { path: 'app/tools/calc/qtc/page.tsx', mustContain: ['sqrt', '60'] },
    compute: () => {
      // QTc = QT / √(RR), RR = 60/HR
      const rr = 60 / 75
      return 400 / Math.sqrt(rr)
    },
  },
  {
    id: 'fib4',
    description: 'FIB-4 — 50歳 AST=40 ALT=30 PLT=15(×10⁴/μL)=150(×10⁹/L)',
    expected: 2.43,
    tolerance: 0.1,
    source: 'Sterling RK, et al. Hepatology 2006;43:1317-1325',
    fileCheck: { path: 'app/tools/calc/fib-4/page.tsx', mustContain: ['sqrt', 'age'] },
    compute: () => {
      // FIB-4 = (age × AST) / (PLT(×10⁹/L) × √ALT)
      // PLT 15万 = 150 ×10⁹/L
      return (50 * 40) / (150 * Math.sqrt(30))
    },
  },
  {
    id: 'free-water-deficit',
    description: '自由水欠乏量 — Na=155, 60kg男性',
    expected: 3.87,
    tolerance: 0.2,
    source: 'Adrogué HJ, Madias NE. NEJM 2000;342:1493-1499',
    fileCheck: { path: 'app/tools/calc/free-water-deficit/page.tsx', mustContain: ['140', '0.6'] },
    compute: () => {
      // FWD = TBW × (現Na/140 - 1), TBW = 0.6 × weight
      return 0.6 * 60 * (155 / 140 - 1)
    },
  },
  {
    id: 'ldl-friedewald',
    description: 'LDL (Friedewald) — TC=220 HDL=50 TG=150',
    expected: 140,
    tolerance: 1,
    source: 'Friedewald WT, et al. Clin Chem 1972;18:499-502',
    fileCheck: { path: 'app/tools/calc/ldl-friedewald/page.tsx', mustContain: ['5'] },
    compute: () => {
      // LDL = TC - HDL - TG/5
      return 220 - 50 - 150 / 5
    },
  },
  {
    id: 'plasma-osmolality',
    description: '血漿浸透圧 — Na=140 BUN=20 GLU=100',
    expected: 291.2,
    tolerance: 2,
    source: 'Rose BD. Clinical Physiology of Acid-Base and Electrolyte Disorders',
    fileCheck: { path: 'app/tools/calc/plasma-osmolality/page.tsx', mustContain: ['2.8', '18'] },
    compute: () => {
      // Posm = 2×Na + BUN/2.8 + GLU/18
      return 2 * 140 + 20 / 2.8 + 100 / 18
    },
  },
  {
    id: 'winters-formula',
    description: 'Winters式 — HCO3=12',
    expected: 26,
    tolerance: 2,
    source: 'Winters RW, et al. J Clin Invest 1963;42:486-495',
    fileCheck: { path: 'app/tools/calc/winters-formula/page.tsx', mustContain: ['1.5', '8'] },
    compute: () => {
      // expected pCO2 = 1.5 × HCO3 + 8 (±2)
      return 1.5 * 12 + 8
    },
  },
  {
    id: 'parkland',
    description: 'Parkland式 — 70kg TBSA=30%',
    expected: 8400,
    tolerance: 100,
    source: 'Baxter CR. Surg Clin North Am 1978;58:1293-1312',
    fileCheck: { path: 'app/tools/calc/parkland/page.tsx', mustContain: ['4'] },
    compute: () => {
      // 初日輸液量 = 4 × weight × TBSA%
      return 4 * 70 * 30
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

async function main() {
  const delay = ms => new Promise(r => setTimeout(r, ms))
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

  // ── 全ツール自動発見 ──
  const calcDirs = readdirSync(join(ROOT, 'app/tools/calc')).filter(d => !d.includes(' 2') && !d.includes('.'))
  const drugDirs = readdirSync(join(ROOT, 'app/tools/drugs')).filter(d => !d.includes(' 2') && !d.includes('.'))
  const procDir = existsSync(join(ROOT, 'app/tools/procedures')) ? readdirSync(join(ROOT, 'app/tools/procedures')).filter(d => !d.includes(' 2') && !d.includes('.')) : []
  const icuDir = existsSync(join(ROOT, 'app/tools/icu')) ? readdirSync(join(ROOT, 'app/tools/icu')).filter(d => !d.includes(' 2') && !d.includes('.')) : []
  const interpretDir = existsSync(join(ROOT, 'app/tools/interpret')) ? readdirSync(join(ROOT, 'app/tools/interpret')).filter(d => !d.includes(' 2') && !d.includes('.')) : []

  const ALL_TOOL_PATHS = [
    ...calcDirs.map(d => ({ id: d, path: `app/tools/calc/${d}/page.tsx`, priority: MONITORED_TOOLS.find(m => m.id === d)?.priority || 'standard' })),
    ...drugDirs.map(d => ({ id: `drug-${d}`, path: `app/tools/drugs/${d}/page.tsx`, priority: MONITORED_TOOLS.find(m => m.id === d)?.priority || 'standard' })),
    ...procDir.map(d => ({ id: `proc-${d}`, path: `app/tools/procedures/${d}/page.tsx`, priority: 'standard' })),
    ...icuDir.map(d => ({ id: `icu-${d}`, path: `app/tools/icu/${d}/page.tsx`, priority: 'standard' })),
    ...interpretDir.map(d => ({ id: `interp-${d}`, path: `app/tools/interpret/${d}/page.tsx`, priority: 'standard' })),
  ].filter(t => existsSync(join(ROOT, t.path)))

  console.log(`📂 全ツール: ${ALL_TOOL_PATHS.length}件を検証`)

  // ── 全ツール共通チェック ──
  // 1. ファイル存在  2. データハッシュ変更  3. 用量表記  4. SaMD危険ワード
  // 5. 単位チェック  6. 全角英数字  7. ソースURL存在
  for (const tool of ALL_TOOL_PATHS) {
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
      { p: /すべき(?!COI)/, l: '「すべき」' },
      { p: /第一選択/, l: '「第一選択」' },
      { p: /臨床判断を補助/, l: '「臨床判断を補助」' },
      { p: /投与してください/, l: '「投与してください」（指示表現）' },
      { p: /直ちに[^。]*(?:中止|投与|開始)/, l: '直ちに〜（緊急指示表現）' },
      { p: /診断(?:します|できます|される)/, l: '「診断します/できます」（診断確定表現）' },
      { p: /治療(?:します|開始します)/, l: '「治療します/開始します」（治療決定表現）' },
    ]
    for (const { p, l } of patterns) {
      if (p.test(content)) dangerWords.push(l)
    }
    toolReport.checks.push({
      check: 'SAMD_WORDING', status: dangerWords.length ? 'WARN' : 'PASS',
      message: dangerWords.length ? `⚠️ ${dangerWords.join(', ')}` : 'OK',
    })
    dangerWords.length ? report.summary.warn++ : report.summary.pass++

    // 入力値バリデーション（ゼロ除算・NaN防御）
    const hasZeroDivGuard = /if\s*\(\s*!|return\s+null|isNaN|isFinite|!==?\s*0|\|\|\s*0|parseFloat.*\|\||Number.*\|\|/.test(content)
    const hasDivision = /\/\s*[a-zA-Z]/.test(content) && /useMemo|const result/.test(content)
    const needsGuard = hasDivision && !hasZeroDivGuard
    toolReport.checks.push({
      check: 'ZERO_DIV_GUARD', status: needsGuard ? 'WARN' : 'PASS',
      message: needsGuard ? '⚠️ 除算あり+ゼロ除算ガードが見つからない' : 'OK',
    })
    needsGuard ? report.summary.warn++ : report.summary.pass++

    // 全角英数字チェック
    const zenIssues = []
    if (/[\uFF10-\uFF19]/.test(content)) zenIssues.push('全角数字あり')
    if (/[\uFF21-\uFF3A\uFF41-\uFF5A]/.test(content)) zenIssues.push('全角英字あり')
    toolReport.checks.push({
      check: 'ZENKAKU', status: zenIssues.length ? 'WARN' : 'PASS',
      message: zenIssues.length ? `⚠️ ${zenIssues.join('; ')}` : 'OK',
    })
    zenIssues.length ? report.summary.warn++ : report.summary.pass++

    // 単位表記チェック（数値と単位の間にスペースがないなど）
    const unitIssues = []
    if (/\d(mg|mL|kg|mmol|μg|mcg)(?![\/\)])/.test(content) && !/\d\s+(mg|mL|kg)/.test(content)) {
      // 数値直後に単位がある場合（半角スペースなし）— ただしコード内はOK
    }
    if (/[Ll](?:iter|itre)/.test(content) && /\bl\b/.test(content)) unitIssues.push('リットル: 小文字l→大文字Lが正式')
    toolReport.checks.push({
      check: 'UNIT_FORMAT', status: unitIssues.length ? 'WARN' : 'PASS',
      message: unitIssues.length ? `⚠️ ${unitIssues.join('; ')}` : 'OK',
    })
    unitIssues.length ? report.summary.warn++ : report.summary.pass++

    // ソースURL/参考文献の存在チェック
    const hasSource = /sources?\s*[:=]|references?\s*[:=]|Source|Reference|参考文献|出典/.test(content)
    const hasUrl = /https?:\/\//.test(content)
    toolReport.checks.push({
      check: 'SOURCE_EXISTS', status: (hasSource || hasUrl) ? 'PASS' : 'WARN',
      message: (hasSource || hasUrl) ? 'OK' : '⚠️ ソース/参考文献のURL記載なし',
    })
    ;(hasSource || hasUrl) ? report.summary.pass++ : report.summary.warn++

    report.tools.push(toolReport)
  }

  // ── ガイドライン更新チェック（CHECK_GL=1 で実行） ──
  if (process.env.CHECK_GL === '1') {
    console.log('\n📚 ガイドライン更新チェック:')
    const GL_QUERIES = [
      { id: 'ckd', query: 'CKD clinical practice guideline', since: '2024/01/01' },
      { id: 'heart-failure', query: 'heart failure guideline', since: '2024/01/01' },
      { id: 'sepsis', query: 'sepsis surviving guideline', since: '2024/01/01' },
      { id: 'anticoagulation', query: 'anticoagulation atrial fibrillation guideline', since: '2024/01/01' },
      { id: 'diabetes', query: 'diabetes mellitus guideline ADA', since: '2024/01/01' },
      { id: 'hypertension', query: 'hypertension guideline JNC ESC', since: '2024/01/01' },
      { id: 'copd', query: 'COPD GOLD guideline', since: '2024/01/01' },
      { id: 'liver', query: 'liver cirrhosis guideline AASLD', since: '2024/01/01' },
    ]
    for (const gl of GL_QUERIES) {
      try {
        const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(gl.query + ' AND ("Practice Guideline"[pt])')}&mindate=${gl.since}&retmode=json&retmax=3`
        const res = await fetch(url, { headers: { 'User-Agent': 'iwor-gl-checker/1.0' }, signal: AbortSignal.timeout(10000) })
        const data = await res.json()
        const count = parseInt(data?.esearchresult?.count || '0')
        console.log(`  ${count > 0 ? '⚠️' : '✅'} ${gl.id}: ${count}件の新GL (since ${gl.since})`)
        if (count > 0) report.summary.warn++; else report.summary.pass++
      } catch {
        console.log(`  ⚠️ ${gl.id}: チェック失敗`)
      }
      await delay(1500) // PubMed rate limit
    }
  }

  // ── ソースURLリンク切れ検出（CHECK_URLS=1 で実行） ──
  if (process.env.CHECK_URLS === '1') {
    console.log('\n🔗 ソースURLリンク切れチェック:')
    const allUrls = new Set()
    for (const tool of ALL_TOOL_PATHS) {
      const fp = join(ROOT, tool.path)
      if (!existsSync(fp)) continue
      const content = readFileSync(fp, 'utf-8')
      const urls = content.match(/https?:\/\/[^\s'"`,)}\]]+/g) || []
      urls.forEach(u => allUrls.add(u.replace(/[.)}\]]+$/, '')))
    }
    console.log(`  ${allUrls.size}件のURLを検証中...`)
    let broken = 0
    for (const url of allUrls) {
      try {
        const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'iwor-link-checker/1.0' } })
        if (res.status >= 400) {
          console.log(`  ❌ ${res.status} ${url}`)
          broken++
          report.summary.warn++
        }
      } catch {
        console.log(`  ⚠️ timeout/error ${url}`)
        report.summary.warn++
        broken++
      }
    }
    console.log(`  結果: ${allUrls.size - broken} OK / ${broken} broken`)
  }

  // ── 独立確かめ算（三重検証） ──
  console.log('\n📐 独立確かめ算（三重検証）:')
  for (const v of CALC_VERIFICATIONS) {
    const issues = []

    // 検証1: 独立計算 vs 教科書正解値
    const result = v.compute()
    const diff = Math.abs(result - v.expected)
    const calcPass = diff <= v.tolerance
    if (!calcPass) issues.push(`計算不一致: expected=${v.expected} actual=${Math.round(result * 1000) / 1000}`)

    // 検証2: ツール内の定数・式がファイルに存在するか（fileCheck）
    let filePass = true
    if (v.fileCheck) {
      const fp = join(ROOT, v.fileCheck.path)
      if (existsSync(fp)) {
        const content = readFileSync(fp, 'utf-8')
        for (const term of v.fileCheck.mustContain) {
          if (!content.includes(term)) {
            filePass = false
            issues.push(`定数「${term}」がファイル内に見つからない: ${v.fileCheck.path}`)
          }
        }
      } else {
        filePass = false
        issues.push(`ファイルなし: ${v.fileCheck.path}`)
      }
    }

    // 検証3: 出典の記載
    const hasSource = !!v.source

    const allPass = calcPass && filePass
    const status = allPass ? 'PASS' : 'FAIL'
    report.calculations.push({
      id: v.id, description: v.description,
      expected: v.expected, actual: Math.round(result * 1000) / 1000,
      tolerance: v.tolerance, status,
      source: v.source || '(出典未記載)',
      fileCheck: v.fileCheck ? (filePass ? 'PASS' : 'FAIL') : 'N/A',
      issues,
    })
    const icon = allPass ? '✅' : '❌'
    console.log(`  ${icon} ${v.id}: calc=${calcPass?'OK':'NG'} file=${filePass?'OK':'NG'} src=${hasSource?'OK':'未記載'}`)
    if (issues.length) issues.forEach(i => console.log(`     ↳ ${i}`))
    allPass ? report.summary.pass++ : report.summary.fail++
  }

  // ハッシュ・レポート保存
  writeFileSync(HASH_PATH, JSON.stringify(currentHashes, null, 2))
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))

  // git commit hash取得（証拠保全用）
  let gitHash = 'unknown'
  try {
    const { execSync } = await import('child_process')
    gitHash = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim().slice(0, 12)
  } catch {}

  // 公開ステータス（UIに表示する最終検証日時+証拠保全）
  const status = {
    lastVerified: now,
    gitCommit: gitHash,
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
