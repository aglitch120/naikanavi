import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/mdx'
import { categories, clusterColors } from '@/lib/blog-config'

export const metadata: Metadata = {
  title: 'SEOヘルスチェック | iwor管理',
  robots: { index: false, follow: false },
}

const BLOG_DIR = 'content/blog'

function analyzeSEO() {
  const posts = getAllPosts()
  const existing = new Set(posts.map(p => p.slug))

  // 全記事の詳細データ収集
  const articleData = posts.map(post => {
    const content = fs.readFileSync(path.join(BLOG_DIR, `${post.slug}.mdx`), 'utf-8')
    const title = (content.match(/^title:\s*["']?(.+?)["']?\s*$/m) || [])[1]?.replace(/^["']|["']$/g, '') || ''
    const desc = (content.match(/^description:\s*["']?(.+?)["']?\s*$/m) || [])[1]?.replace(/^["']|["']$/g, '') || ''
    const outlinks = (content.match(/\(\/blog\/([^)#\s"]+)\)/g) || [])
      .map(m => m.slice(7, -1))
      .filter(s => existing.has(s) && s !== post.slug)
    const hasFaq = /^## (よくある質問|FAQ)/m.test(content)
    const svgCount = (content.match(/<svg/g) || []).length
    const ctaCount = (content.match(/\/pro/g) || []).length
    const size = content.length

    return {
      slug: post.slug,
      title,
      desc,
      category: post.category,
      outlinks: outlinks.length,
      hasFaq,
      svgCount,
      ctaCount,
      size,
    }
  })

  // 被リンク数カウント
  const inlinkCount: Record<string, number> = {}
  for (const post of posts) inlinkCount[post.slug] = 0
  for (const a of articleData) {
    const content = fs.readFileSync(path.join(BLOG_DIR, `${a.slug}.mdx`), 'utf-8')
    for (const m of content.match(/\(\/blog\/([^)#\s"]+)\)/g) || []) {
      const target = m.slice(7, -1)
      if (target in inlinkCount && target !== a.slug) inlinkCount[target]++
    }
  }

  // 孤立ページ（被リンク0）
  const orphans = articleData.filter(a => inlinkCount[a.slug] === 0)

  // title/description の長さ問題
  const metaIssues = articleData.flatMap(a => {
    const issues: string[] = []
    if (a.title.length > 60) issues.push(`title長すぎ(${a.title.length}字)`)
    if (a.title.length < 15) issues.push(`title短すぎ(${a.title.length}字)`)
    if (a.desc.length > 160) issues.push(`desc長すぎ(${a.desc.length}字)`)
    if (a.desc.length < 50) issues.push(`desc短すぎ(${a.desc.length}字)`)
    return issues.length ? [{ slug: a.slug, title: a.title, issues }] : []
  })

  // 内部リンク密度（発リンク数ランキング）
  const topLinked = [...articleData].sort((a, b) => inlinkCount[b.slug] - inlinkCount[a.slug]).slice(0, 10)
  const bottomLinked = [...articleData].sort((a, b) => inlinkCount[a.slug] - inlinkCount[b.slug]).slice(0, 10)

  // 記事ごとの全体スコア（100点満点）
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
  const lowScore = scored.filter(a => a.score < 70).sort((a, b) => a.score - b.score)
  const avgScore = Math.round(scored.reduce((s, a) => s + a.score, 0) / scored.length)

  return { articleData, orphans, metaIssues, topLinked, bottomLinked, lowScore, avgScore, inlinkCount, scored }
}

export default function SeoHealthPage() {
  const { orphans, metaIssues, topLinked, bottomLinked, lowScore, avgScore, inlinkCount } = analyzeSEO()
  const total = 173

  const scoreColor = avgScore >= 90 ? '#166534' : avgScore >= 75 ? '#92400E' : '#991B1B'
  const scoreBg = avgScore >= 90 ? '#DCFCE7' : avgScore >= 75 ? '#FEF3C7' : '#FEE2E2'

  return (
    <div className="max-w-5xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tx mb-1">SEOヘルスチェック</h1>
          <p className="text-sm text-muted">内部リンク・メタデータ・孤立ページの分析</p>
        </div>
        <Link href="/admin" className="text-sm text-ac hover:text-ac2 transition-colors">
          ← ダッシュボードへ
        </Link>
      </div>

      {/* スコアサマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '平均SEOスコア', value: `${avgScore}点`, color: scoreColor, bg: scoreBg },
          { label: '孤立ページ', value: `${orphans.length}本`, color: orphans.length === 0 ? '#166534' : '#991B1B', bg: orphans.length === 0 ? '#DCFCE7' : '#FEE2E2' },
          { label: 'メタデータ問題', value: `${metaIssues.length}本`, color: metaIssues.length === 0 ? '#166534' : '#92400E', bg: metaIssues.length === 0 ? '#DCFCE7' : '#FEF3C7' },
          { label: 'スコア70点未満', value: `${lowScore.length}本`, color: lowScore.length === 0 ? '#166534' : '#991B1B', bg: lowScore.length === 0 ? '#DCFCE7' : '#FEE2E2' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-s0 border border-br rounded-xl p-5">
            <p className="text-xs text-muted mb-2">{label}</p>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* 孤立ページ */}
        <div className="bg-s0 border border-br rounded-xl p-5">
          <h2 className="text-sm font-semibold text-tx mb-1 flex items-center justify-between">
            孤立ページ（被リンク0本）
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${orphans.length === 0 ? 'bg-okl text-ok' : 'bg-dnl text-dn'}`}>
              {orphans.length}本
            </span>
          </h2>
          <p className="text-xs text-muted mb-3">他記事からリンクされていないページ。内部リンクを追加することでクロールされやすくなります。</p>
          {orphans.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">✅ 孤立ページなし</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {orphans.map(a => (
                <div key={a.slug} className="flex items-center justify-between gap-2 py-1.5 border-b border-br last:border-0">
                  <Link href={`/blog/${a.slug}`} target="_blank" className="text-xs text-tx hover:text-ac transition-colors truncate flex-1">
                    {a.slug}
                  </Link>
                  <span className="text-[10px] text-dn bg-dnl px-1.5 py-0.5 rounded flex-shrink-0">被リンク0</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* メタデータ問題 */}
        <div className="bg-s0 border border-br rounded-xl p-5">
          <h2 className="text-sm font-semibold text-tx mb-1 flex items-center justify-between">
            メタデータ問題
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${metaIssues.length === 0 ? 'bg-okl text-ok' : 'bg-wnl text-wn'}`}>
              {metaIssues.length}本
            </span>
          </h2>
          <p className="text-xs text-muted mb-3">title: 15〜60文字、description: 50〜160文字が推奨です。</p>
          {metaIssues.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">✅ メタデータ問題なし</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {metaIssues.map(({ slug, title, issues }) => (
                <div key={slug} className="text-xs border border-br rounded-lg p-2.5">
                  <Link href={`/blog/${slug}`} target="_blank" className="font-medium text-tx hover:text-ac block truncate mb-1">{title || slug}</Link>
                  <div className="flex flex-wrap gap-1">
                    {issues.map(i => <span key={i} className="bg-wnl text-wn px-1.5 py-0.5 rounded text-[10px]">{i}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* 被リンク上位 */}
        <div className="bg-s0 border border-br rounded-xl p-5">
          <h2 className="text-sm font-semibold text-tx mb-1">被リンク数 上位10記事</h2>
          <p className="text-xs text-muted mb-3">サイト内で多くリンクされているハブ記事</p>
          <div className="space-y-2">
            {topLinked.map((a, i) => (
              <div key={a.slug} className="flex items-center gap-3">
                <span className="text-xs text-muted w-4 text-right flex-shrink-0">{i + 1}</span>
                <Link href={`/blog/${a.slug}`} target="_blank" className="text-xs text-tx hover:text-ac truncate flex-1">{a.slug}</Link>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="h-1.5 rounded-full bg-ac opacity-70" style={{ width: `${Math.max(4, inlinkCount[a.slug] * 6)}px` }} />
                  <span className="text-xs font-medium text-tx w-5 text-right">{inlinkCount[a.slug]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 被リンク下位 */}
        <div className="bg-s0 border border-br rounded-xl p-5">
          <h2 className="text-sm font-semibold text-tx mb-1">被リンク数 下位10記事</h2>
          <p className="text-xs text-muted mb-3">他記事からのリンクが少ない記事。内部リンク強化を検討</p>
          <div className="space-y-2">
            {bottomLinked.map((a, i) => (
              <div key={a.slug} className="flex items-center gap-3">
                <span className="text-xs text-muted w-4 text-right flex-shrink-0">{i + 1}</span>
                <Link href={`/blog/${a.slug}`} target="_blank" className="text-xs text-tx hover:text-ac truncate flex-1">{a.slug}</Link>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${inlinkCount[a.slug] === 0 ? 'text-dn bg-dnl' : 'text-wn bg-wnl'}`}>
                  {inlinkCount[a.slug]}本
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* スコア低い記事 */}
      {lowScore.length > 0 && (
        <div className="bg-s0 border border-br rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-tx mb-1">SEOスコア70点未満の記事</h2>
          <p className="text-xs text-muted mb-3">
            採点基準: サイズ(-20) SVG(-20) CTA(-15) 内部リンク(-15) FAQ(-15) 被リンク0(-15)
          </p>
          <div className="divide-y divide-br">
            {lowScore.map(a => (
              <div key={a.slug} className="py-2.5 flex items-center gap-3">
                <span
                  className="text-xs font-bold w-10 text-center px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{
                    color: a.score < 50 ? '#991B1B' : '#92400E',
                    background: a.score < 50 ? '#FEE2E2' : '#FEF3C7',
                  }}
                >
                  {a.score}点
                </span>
                <Link href={`/blog/${a.slug}`} target="_blank" className="text-sm text-tx hover:text-ac truncate flex-1">
                  {a.slug}
                </Link>
                <div className="flex gap-1 flex-shrink-0">
                  {a.size < 12000 && <span className="text-[10px] bg-dnl text-dn px-1 py-0.5 rounded">サイズ</span>}
                  {a.svgCount < 2 && <span className="text-[10px] bg-dnl text-dn px-1 py-0.5 rounded">SVG</span>}
                  {a.ctaCount < 2 && <span className="text-[10px] bg-dnl text-dn px-1 py-0.5 rounded">CTA</span>}
                  {a.outlinks < 3 && <span className="text-[10px] bg-dnl text-dn px-1 py-0.5 rounded">発リンク</span>}
                  {!a.hasFaq && <span className="text-[10px] bg-dnl text-dn px-1 py-0.5 rounded">FAQ</span>}
                  {a.inlinks === 0 && <span className="text-[10px] bg-wnl text-wn px-1 py-0.5 rounded">被リンク0</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ナビゲーション */}
      <div className="flex gap-3">
        <Link href="/admin" className="flex-1 bg-s0 border border-br rounded-lg p-3 text-sm text-muted hover:text-ac hover:border-ac transition-colors text-center">
          ← ダッシュボード
        </Link>
        <Link href="/sitemap.xml" target="_blank" className="flex-1 bg-s0 border border-br rounded-lg p-3 text-sm text-muted hover:text-ac hover:border-ac transition-colors text-center">
          サイトマップ確認 →
        </Link>
      </div>
    </div>
  )
}
