import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const CONTENT_DIR = path.join(process.cwd(), 'content/blog')
const OUTPUT_PATH = path.join(process.cwd(), 'public/search-index.json')

// カテゴリ名マッピング
const categoryNames = {
  'josler-basics': 'J-OSLER基礎',
  'case-registration': '症例登録',
  'medical-history': '病歴要約',
  'progress-management': '進捗管理',
  'specialist-exam': '内科専門医試験',
  'career': 'キャリア',
  'ai-tools': 'AI・ツール',
  'academic': '学会・論文',
  'part-time': 'バイト・収入',
  'tax-saving': '税金・節税',
  'mental-life': 'メンタル・生活',
  'life-events': '結婚・出産',
}

const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.mdx'))

const index = files
  .map(file => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8')
    const { data } = matter(raw)
    if (data.status !== 'published') return null
    return {
      s: file.replace(/\.mdx$/, ''),           // slug
      t: data.title || '',                       // title
      d: data.description || '',                 // description
      c: categoryNames[data.category] || '',     // categoryName
      g: (data.tags || []).join(' '),            // tags joined
    }
  })
  .filter(Boolean)

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index), 'utf-8')
console.log(`Generated search index for ${index.length} articles → ${OUTPUT_PATH}`)
