/**
 * OGP メタデータ生成スクリプト
 * 
 * MDXのフロントマターから opengraph-image.tsx 用のメタデータを自動生成する。
 * 新記事追加時にOGPが灰色になるバグを防止するため、
 * ハードコードのマップではなくこのスクリプトで一括生成する。
 * 
 * 使い方: node scripts/generate-ogp-meta.mjs
 * ビルド前に自動実行される（package.json の prebuild に設定）
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.join(__dirname, '..', 'content', 'blog')
const OUTPUT_PATH = path.join(__dirname, '..', 'lib', 'ogp-meta.json')

// カテゴリスラッグ → 日本語表示名
const categoryDisplayNames = {
  'josler-basics': 'J-OSLER基礎',
  'case-registration': '症例登録',
  'medical-history': '病歴要約',
  'disease-specific': '疾患別病歴要約',
  'progress-management': '進捗管理',
  'jmecc-training': 'JMECC・講習',
  'specialist-exam': '内科専門医試験',
  'exam-by-field': '試験領域別',
  'comprehensive-exam': '総合内科専門医',
  'ai-tools': 'AI・ツール',
  'mental-life': 'メンタル・生活',
  'part-time': 'バイト・収入',
  'tax-saving': '税金・節税',
  'career': 'キャリア',
  'academic': '学会・論文',
  'life-events': '結婚・出産',
  'subspecialty': 'サブスペJ-OSLER',
  'others': 'その他',
}

// タイトルからOGP用の短いタイトルを生成
function shortenTitle(fullTitle) {
  // 【...】を除去
  let title = fullTitle.replace(/【[^】]*】\s*/, '')
  // ｜以降を除去（サブタイトルに回す）
  const parts = title.split(/[｜|]/)
  return {
    title: parts[0].trim(),
    subtitle: parts.length > 1 ? parts[1].trim() : '',
  }
}

function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error('Content directory not found:', CONTENT_DIR)
    process.exit(1)
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.mdx'))
  const meta = {}

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '')
    const content = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8')
    const { data } = matter(content)

    if (data.status !== 'published') continue

    const { title, subtitle } = shortenTitle(data.title || slug)

    meta[slug] = {
      title,
      subtitle,
      category: data.category || 'others',
    }
  }

  // ピラー記事のメタも追加（静的ページ用）
  const pillarMeta = {
    'josler-complete-guide': { title: 'J-OSLER完全攻略', subtitle: '症例登録から修了認定まで', category: 'josler-basics' },
    'exam-preparation-guide': { title: '内科専門医試験', subtitle: '合格マニュアル', category: 'specialist-exam' },
    'money-guide': { title: '専攻医のお金', subtitle: 'バイト・確定申告・節税', category: 'tax-saving' },
    'money-career-guide': { title: 'お金とキャリア', subtitle: 'バイト・節税・キャリア設計', category: 'career' },
    'lifehack-guide': { title: 'ライフハック大全', subtitle: '研修を乗り切るコツ', category: 'mental-life' },
    'efficiency-guide': { title: '効率化ガイド', subtitle: 'AI・ツールで作業時間を短縮', category: 'ai-tools' },
    'career-guide': { title: 'キャリア設計', subtitle: '完全ロードマップ', category: 'career' },
  }

  Object.assign(meta, pillarMeta)

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(meta, null, 2), 'utf-8')
  console.log(`Generated OGP metadata for ${Object.keys(meta).length} articles → ${OUTPUT_PATH}`)
}

main()
