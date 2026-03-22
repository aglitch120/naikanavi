#!/usr/bin/env node
/**
 * iwor ソーシャルプルーフ シードデータ投入スクリプト
 *
 * ストリークランキング・学会参加予定者数・病院気になる数の架空データを生成し
 * Worker API経由でKVに投入する。
 *
 * 使い方:
 *   ADMIN_KEY=xxx node scripts/seed-social-proof.mjs
 *   ADMIN_KEY=xxx node scripts/seed-social-proof.mjs --dry-run  (確認のみ)
 *
 * 環境変数:
 *   ADMIN_KEY  — Worker APIの管理者キー (必須)
 *   API_BASE   — Worker API URL (デフォルト: https://iwor-api.mightyaddnine.workers.dev)
 */

const API_BASE = process.env.API_BASE || 'https://iwor-api.mightyaddnine.workers.dev'
const ADMIN_KEY = process.env.ADMIN_KEY
const DRY_RUN = process.argv.includes('--dry-run')

if (!ADMIN_KEY) {
  console.error('Error: ADMIN_KEY environment variable is required')
  process.exit(1)
}

// ── ランダムな日本人風ニックネーム ──
const FIRST_PARTS = ['Dr.', '内科', '外科', '循環器', '消化器', '呼吸器', '救急', '研修医', '専攻医']
const SECOND_PARTS = ['太郎', '花子', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U']
const SUFFIXES = ['', '@東京', '@大阪', '@名古屋', '@福岡', '@札幌', '@仙台', '@横浜', '@神戸', '@京都']

function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

function generateName() {
  return `${randomPick(FIRST_PARTS)}${randomPick(SECOND_PARTS)}${randomPick(SUFFIXES)}`
}

// ── ストリークランキング シードデータ ──
function generateStreakLeaderboard(count = 50) {
  const entries = []
  const usedNames = new Set()
  for (let i = 0; i < count; i++) {
    let name
    do { name = generateName() } while (usedNames.has(name))
    usedNames.add(name)

    // 上位は高ストリーク、下位はバラつき
    const tier = i / count
    let streakCount
    if (tier < 0.05) streakCount = randomInt(60, 120)      // トップ5%: 60-120日
    else if (tier < 0.15) streakCount = randomInt(30, 60)   // 10%: 30-60日
    else if (tier < 0.35) streakCount = randomInt(14, 30)   // 20%: 14-30日
    else if (tier < 0.65) streakCount = randomInt(5, 14)    // 30%: 5-14日
    else streakCount = randomInt(1, 5)                       // 35%: 1-5日

    entries.push({
      email: `seed_${i}@iwor.internal`,
      displayName: name,
      count: streakCount,
    })
  }
  return entries.sort((a, b) => b.count - a.count)
}

// ── 学会参加予定者数 シードデータ ──
function generateConferenceCounts() {
  // 主要学会IDと参加予定者数のレンジ
  const conferences = [
    'jsim-2026', 'jcs-2026', 'jrs-2026', 'jsg-2026', 'jsn-2026',
    'jshem-2026', 'jns-2026', 'jcr-2026', 'jaid-2026', 'jds-2026',
    'jes-2026', 'jss-2026', 'jaam-2026', 'jsa-2026', 'jps-2026',
  ]
  const counts = {}
  for (const id of conferences) {
    counts[id] = randomInt(3, 25)
  }
  return counts
}

// ── 病院気になる数 シードデータ ──
function generateHospitalInterestCounts() {
  // 人気上位病院にはより多くの「気になる」数
  const hospitals = {}
  for (let i = 1; i <= 45; i++) {
    const id = `hospital-${i}`
    // 上位10病院は人気、残りはバラつき
    hospitals[id] = i <= 10 ? randomInt(8, 30) : randomInt(1, 10)
  }
  return hospitals
}

// ── メイン ──
async function main() {
  console.log(`\n=== iwor Social Proof Seed Data ===`)
  console.log(`API: ${API_BASE}`)
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`)
  console.log()

  // 1. ストリークランキング
  const leaderboard = generateStreakLeaderboard(50)
  console.log(`Streak leaderboard: ${leaderboard.length} entries`)
  console.log(`  Top 3: ${leaderboard.slice(0, 3).map(e => `${e.displayName}(${e.count}d)`).join(', ')}`)
  console.log(`  Median: ${leaderboard[25].count}d`)

  if (!DRY_RUN) {
    const res = await fetch(`${API_BASE}/api/admin/seed-leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
      body: JSON.stringify({ leaderboard }),
    })
    if (res.ok) {
      console.log('  -> Leaderboard seeded successfully')
    } else {
      console.log(`  -> Error: ${res.status} ${await res.text()}`)
      // フォールバック: 直接KV書き込み用データをファイルに出力
      console.log('  -> Fallback: Writing leaderboard JSON for manual KV import')
    }
  }

  // 2. 学会参加予定者数
  const confCounts = generateConferenceCounts()
  console.log(`\nConference counts: ${Object.keys(confCounts).length} conferences`)
  console.log(`  Example: ${Object.entries(confCounts).slice(0, 3).map(([k, v]) => `${k}=${v}`).join(', ')}`)

  // 3. 病院気になる数
  const hospCounts = generateHospitalInterestCounts()
  console.log(`\nHospital interest counts: ${Object.keys(hospCounts).length} hospitals`)
  console.log(`  Most popular: ${Object.entries(hospCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}=${v}`).join(', ')}`)

  // ── JSON出力（手動投入用） ──
  const seedData = {
    generatedAt: new Date().toISOString(),
    streakLeaderboard: leaderboard,
    conferenceCounts: confCounts,
    hospitalInterestCounts: hospCounts,
  }

  const outPath = 'scripts/seed-data.json'
  const fs = await import('fs')
  fs.writeFileSync(outPath, JSON.stringify(seedData, null, 2))
  console.log(`\nSeed data written to ${outPath}`)
  console.log('To manually import to KV:')
  console.log('  npx wrangler kv key put --namespace-id=<ID> "streak:leaderboard" \'<JSON>\'')

  console.log('\nDone!')
}

main().catch(console.error)
