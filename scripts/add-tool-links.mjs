#!/usr/bin/env node
/**
 * 記事⇔ツール 相互内部リンク挿入スクリプト
 * 
 * 記事のタイトル・本文をスキャンして関連ツールを特定し、
 * 記事末尾に「関連臨床ツール」ボックスを追加する。
 * 
 * 実行: node scripts/add-tool-links.mjs
 * dry-run: node scripts/add-tool-links.mjs --dry-run
 */

import fs from 'fs'
import path from 'path'

const DRY_RUN = process.argv.includes('--dry-run')

// ツール定義（slug → 表示名 + マッチキーワード）
const toolMap = [
  { slug: 'egfr', name: 'eGFR計算（CKD-EPI）', keywords: ['eGFR', 'GFR', '腎機能', 'CKD', 'クレアチニン', '糸球体濾過'] },
  { slug: 'cha2ds2-vasc', name: 'CHA₂DS₂-VASc', keywords: ['CHA2DS2', 'CHADS', '心房細動', 'AF', 'Af', '抗凝固'] },
  { slug: 'chads2', name: 'CHADS₂', keywords: ['CHADS2', '心房細動'] },
  { slug: 'has-bled', name: 'HAS-BLED', keywords: ['HAS-BLED', 'HASBLED', '出血リスク', '出血スコア'] },
  { slug: 'child-pugh', name: 'Child-Pugh', keywords: ['Child-Pugh', 'チャイルドピュー', '肝硬変', '肝予備能'] },
  { slug: 'meld', name: 'MELD', keywords: ['MELD', '肝移植', '末期肝疾患'] },
  { slug: 'curb-65', name: 'CURB-65', keywords: ['CURB-65', 'CURB65', '市中肺炎', 'CAP'] },
  { slug: 'a-drop', name: 'A-DROP', keywords: ['A-DROP', 'ADROP', '肺炎重症度'] },
  { slug: 'wells-pe', name: 'Wells PE', keywords: ['Wells', '肺塞栓', '肺血栓塞栓'] },
  { slug: 'wells-dvt', name: 'Wells DVT', keywords: ['Wells', 'DVT', '深部静脈血栓'] },
  { slug: 'grace', name: 'GRACE', keywords: ['GRACEスコア', 'GRACE score', '急性冠症候群'] },
  { slug: 'qsofa', name: 'qSOFA', keywords: ['qSOFA', 'quick SOFA'] },
  { slug: 'sofa', name: 'SOFA', keywords: ['SOFAスコア', 'SOFA score', 'Sepsis-3'] },
  { slug: 'fib-4', name: 'FIB-4 index', keywords: ['FIB-4', 'FIB4', '肝線維化', 'NAFLD', 'NASH'] },
  { slug: 'corrected-ca', name: '補正Ca', keywords: ['補正Ca', '補正カルシウム', 'Payne', '低アルブミン'] },
  { slug: 'aa-gradient', name: 'A-aDO₂', keywords: ['A-aDO2', 'AaDO2', '肺胞気動脈血', '酸素分圧較差'] },
  { slug: 'cockcroft-gault', name: 'Cockcroft-Gault', keywords: ['Cockcroft', 'CCr', 'クレアチニンクリアランス'] },
  { slug: 'bmi', name: 'BMI計算', keywords: ['BMI', '体格指数', '肥満度'] },
  { slug: 'bsa', name: 'BSA（体表面積）', keywords: ['BSA', '体表面積', 'Du Bois'] },
  { slug: 'gcs', name: 'GCS', keywords: ['GCS', 'Glasgow', '意識レベル', '意識障害'] },
  { slug: 'nihss', name: 'NIHSS', keywords: ['NIHSS', 'NIH Stroke', '脳卒中重症度', 'tPA', 'rt-PA'] },
  { slug: 'apache2', name: 'APACHE II', keywords: ['APACHE', 'ICU重症度'] },
  { slug: 'rcri', name: 'RCRI', keywords: ['RCRI', '術前評価', '周術期', '心血管リスク'] },
  { slug: 'anion-gap', name: 'アニオンギャップ', keywords: ['アニオンギャップ', 'anion gap', '代謝性アシドーシス'] },
  { slug: 'abcd2', name: 'ABCD²', keywords: ['ABCD2', 'TIA', '一過性脳虚血'] },
  { slug: 'mrs', name: 'mRS', keywords: ['mRS', 'Rankin', '機能障害度'] },
  { slug: 'ecog', name: 'ECOG PS', keywords: ['ECOG', '全身状態スコア'] },
  { slug: 'karnofsky', name: 'Karnofsky PS', keywords: ['Karnofsky', 'KPS'] },
  { slug: 'maintenance-fluid', name: '維持輸液計算', keywords: ['維持輸液', '4-2-1', 'Holliday-Segar', '輸液量'] },
  { slug: 'na-deficit', name: 'Na欠乏量', keywords: ['Na欠乏', 'ナトリウム欠乏', '低Na血症', '低ナトリウム'] },
  { slug: 'free-water-deficit', name: '自由水欠乏量', keywords: ['自由水', '高Na血症', '高ナトリウム'] },
  { slug: 'na-correction-rate', name: 'Na補正速度', keywords: ['Na補正', 'ODS', '浸透圧性脱髄'] },
  { slug: 'kcl-correction', name: 'KCl補正', keywords: ['KCl', 'カリウム補正', '低K血症', '低カリウム'] },
  { slug: 'steroid-converter', name: 'ステロイド換算', keywords: ['ステロイド換算', 'PSL換算', 'プレドニゾロン換算', 'ステロイド等価'] },
  { slug: 'insulin-sliding', name: 'インスリンスライディングスケール', keywords: ['スライディングスケール', 'インスリン', '血糖管理'] },
  { slug: 'renal-dose-abx', name: '抗菌薬 腎機能別用量', keywords: ['抗菌薬', '腎機能別', '用量調整', '腎投与量'] },
]

// すでに挿入済みマーカー
const MARKER = '{/* iwor-tool-links */}'

const blogDir = path.resolve('content/blog')
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'))

let updated = 0
let skipped = 0

for (const file of files) {
  const filePath = path.join(blogDir, file)
  const content = fs.readFileSync(filePath, 'utf-8')

  // すでにリンク挿入済みならスキップ
  if (content.includes(MARKER)) {
    skipped++
    continue
  }

  // 記事全文からツールキーワードをマッチ
  const contentLower = content.toLowerCase()
  const matched = toolMap.filter(tool =>
    tool.keywords.some(kw => {
      // English terms: word boundary match (case-insensitive)
      if (/^[a-zA-Z0-9\-\s₂₃]+$/.test(kw)) {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`\\b${escaped}\\b`, 'i')
        return regex.test(content)
      }
      // Japanese terms: exact substring match
      return content.includes(kw)
    })
  )

  // マッチするツールがなければスキップ
  if (matched.length === 0) continue

  // 最大5個に絞る
  const top = matched.slice(0, 5)

  // ツールリンクボックスを生成
  const linkSection = `

${MARKER}

---

<div style={{background: 'var(--color-s1, #f5f4f0)', border: '1px solid var(--color-br, #ddd9d2)', borderRadius: '12px', padding: '20px', marginTop: '32px'}}>

**🔧 関連する臨床ツール**

${top.map(t => `- [${t.name}](/tools/calc/${t.slug})`).join('\n')}

すべてのツールは[臨床計算ツール一覧](/tools)からご覧いただけます。

</div>
`

  if (DRY_RUN) {
    console.log(`[DRY] ${file}: +${top.length} tools (${top.map(t => t.slug).join(', ')})`)
  } else {
    fs.writeFileSync(filePath, content + linkSection)
    console.log(`✅ ${file}: +${top.length} tools (${top.map(t => t.slug).join(', ')})`)
  }
  updated++
}

console.log(`\n--- Summary ---`)
console.log(`Updated: ${updated} articles`)
console.log(`Skipped (already linked): ${skipped}`)
console.log(`No match: ${files.length - updated - skipped}`)
if (DRY_RUN) console.log('(DRY RUN — no files changed)')
