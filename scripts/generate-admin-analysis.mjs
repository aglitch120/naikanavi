// Generate admin analysis data at build time → public/admin-analysis.json
import fs from 'fs'
import path from 'path'

const BLOG_DIR = 'content/blog'

function getAllPosts() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'))
  return files.map(f => {
    const content = fs.readFileSync(path.join(BLOG_DIR, f), 'utf-8')
    const slug = f.replace('.mdx', '')
    const title = (content.match(/^title:\s*["']?(.+?)["']?\s*$/m) || [])[1]?.replace(/^["']|["']$/g, '') || ''
    const date = (content.match(/^date:\s*["']?(.+?)["']?\s*$/m) || [])[1]?.replace(/^["']|["']$/g, '') || ''
    const category = (content.match(/^category:\s*["']?(.+?)["']?\s*$/m) || [])[1]?.replace(/^["']|["']$/g, '') || ''
    const readingTime = Math.ceil(content.length / 2000)
    return { slug, title, date, category, readingTime, content }
  }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

const posts = getAllPosts()
const existing = new Set(posts.map(p => p.slug))

const statusCount = { published: 0, draft: 0, needs_review: 0 }
const clusterCount = {}
const qualityIssues = []

// Simple cluster mapping
const categoryToCluster = {
  'josler-basics': 'A', 'case-registration': 'C', 'medical-history': 'B',
  'progress-management': 'D', 'exam-preparation': 'E', 'part-time-work': 'F',
  'tax-return': 'G', 'marriage-family': 'H', 'mental-health': 'I',
  'career': 'J', 'academic': 'K', 'josler-advanced': 'A',
  'subspecialty': 'J', 'ai-tools': 'D', 'lifehack': 'I',
}

const clusterNames = {
  'A': 'J-OSLER基礎', 'B': '病歴要約', 'C': '症例登録', 'D': '進捗管理',
  'E': '試験対策', 'F': 'バイト', 'G': '確定申告', 'H': '結婚',
  'I': 'メンタル', 'J': 'キャリア', 'K': '学会',
}
const clusterColors = {
  'A': '#1E3A5F', 'B': '#1B4F3A', 'C': '#3D5A80', 'D': '#2D6A4F',
  'E': '#7F1D1D', 'F': '#4C1D95', 'G': '#92400E', 'H': '#9D174D',
  'I': '#134E4A', 'J': '#4338CA', 'K': '#6D28D9',
}

const articleData = posts.map(post => {
  const content = post.content
  if (content.includes('status: published')) statusCount.published++
  else if (content.includes('status: draft')) statusCount.draft++
  else if (content.includes('status: needs_review')) statusCount.needs_review++

  const cluster = categoryToCluster[post.category] || 'A'
  clusterCount[cluster] = (clusterCount[cluster] || 0) + 1

  const outlinks = (content.match(/\(\/blog\/([^)#\s"]+)\)/g) || [])
    .map(m => m.slice(7, -1))
    .filter(s => existing.has(s) && s !== post.slug)
  const hasFaq = /^## (よくある質問|FAQ)/m.test(content)
  const svgCount = (content.match(/<svg/g) || []).length
  const ctaCount = (content.match(/\/pro/g) || []).length
  const size = content.length
  const desc = (content.match(/^description:\s*["']?(.+?)["']?\s*$/m) || [])[1]?.replace(/^["']|["']$/g, '') || ''

  const issues = []
  if (size < 12000) issues.push(`サイズ不足(${(size / 1000).toFixed(1)}KB)`)
  if (svgCount < 2) issues.push('SVG不足')
  if (ctaCount < 2) issues.push('CTA不足')
  if (outlinks.length < 3) issues.push(`内部リンク${outlinks.length}本`)
  if (!hasFaq) issues.push('FAQ欠如')
  if (issues.length > 0) qualityIssues.push({ slug: post.slug, issues })

  return {
    slug: post.slug, title: post.title, desc, category: post.category,
    outlinks: outlinks.length, hasFaq, svgCount, ctaCount, size,
    date: post.date, readingTime: post.readingTime,
  }
})

// Inlink count
const inlinkCount = {}
for (const post of posts) inlinkCount[post.slug] = 0
for (const post of posts) {
  for (const m of post.content.match(/\(\/blog\/([^)#\s"]+)\)/g) || []) {
    const target = m.slice(7, -1)
    if (target in inlinkCount && target !== post.slug) inlinkCount[target]++
  }
}

// SEO scores
const scored = articleData.map(a => {
  let score = 100
  if (a.size < 12000) score -= 20
  if (a.svgCount < 2) score -= 20
  if (a.ctaCount < 2) score -= 15
  if (a.outlinks < 3) score -= 15
  if (!a.hasFaq) score -= 15
  if (inlinkCount[a.slug] === 0) score -= 15
  return { ...a, score, inlinks: inlinkCount[a.slug] }
})
const avgScore = Math.round(scored.reduce((s, a) => s + a.score, 0) / scored.length)
const orphans = scored.filter(a => a.inlinks === 0)
const lowScore = scored.filter(a => a.score < 70).sort((a, b) => a.score - b.score)

const metaIssues = articleData.flatMap(a => {
  const issues = []
  if (a.title.length > 60) issues.push(`title長すぎ(${a.title.length}字)`)
  if (a.title.length < 15) issues.push(`title短すぎ(${a.title.length}字)`)
  if (a.desc.length > 160) issues.push(`desc長すぎ(${a.desc.length}字)`)
  if (a.desc.length < 50) issues.push(`desc短すぎ(${a.desc.length}字)`)
  return issues.length ? [{ slug: a.slug, title: a.title, issues }] : []
})

const topLinked = [...scored].sort((a, b) => b.inlinks - a.inlinks).slice(0, 10)
const bottomLinked = [...scored].sort((a, b) => a.inlinks - b.inlinks).slice(0, 10)
const recentPosts = articleData.slice(0, 10)

const clusters = Object.entries(clusterNames).map(([id, name]) => ({
  cluster: id, name, bg: clusterColors[id] || '#666', count: clusterCount[id] || 0,
})).sort((a, b) => b.count - a.count)

const result = {
  total: posts.length,
  statusCount,
  qualityIssues: qualityIssues.slice(0, 30),
  clusters,
  seo: { avgScore, orphanCount: orphans.length, metaIssueCount: metaIssues.length, lowScoreCount: lowScore.length },
  orphans: orphans.slice(0, 20).map(a => ({ slug: a.slug, score: a.score })),
  metaIssues: metaIssues.slice(0, 20),
  topLinked: topLinked.map(a => ({ slug: a.slug, inlinks: a.inlinks })),
  bottomLinked: bottomLinked.map(a => ({ slug: a.slug, inlinks: a.inlinks })),
  lowScore: lowScore.slice(0, 20).map(a => ({ slug: a.slug, score: a.score, size: a.size, svgCount: a.svgCount, ctaCount: a.ctaCount, outlinks: a.outlinks, hasFaq: a.hasFaq, inlinks: a.inlinks })),
  recentPosts: recentPosts.map(p => ({ slug: p.slug, title: p.title, date: p.date, readingTime: p.readingTime, category: p.category })),
  generatedAt: new Date().toISOString(),
}

fs.writeFileSync('public/admin-analysis.json', JSON.stringify(result))
console.log(`Generated admin analysis: ${posts.length} articles, avg SEO score ${avgScore} → public/admin-analysis.json`)
