import fs from 'fs'
import { getAllPosts } from '@/lib/mdx'
import { categories, clusterColors } from '@/lib/blog-config'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '管理画面 | iwor',
  robots: { index: false, follow: false },
}

function readArticle(slug: string) {
  return fs.readFileSync(`content/blog/${slug}.mdx`, 'utf-8')
}

export default function AdminPage() {
  const posts = getAllPosts()

  // ── 基本集計 ──
  const statusCount = { published: 0, draft: 0, needs_review: 0 }
  for (const post of posts) {
    const raw = readArticle(post.slug)
    if (raw.includes('status: published')) statusCount.published++
    else if (raw.includes('status: draft')) statusCount.draft++
    else if (raw.includes('status: needs_review')) statusCount.needs_review++
  }

  // ── クラスター別集計 ──
  const clusterCount: Record<string, number> = {}
  for (const post of posts) {
    const cat = categories[post.category as keyof typeof categories]
    if (cat) clusterCount[cat.cluster] = (clusterCount[cat.cluster] || 0) + 1
  }

  // ── 品質チェック ──
  const qualityIssues: { slug: string; issues: string[] }[] = []
  for (const post of posts) {
    const content = readArticle(post.slug)
    const issues: string[] = []
    if (content.length < 12000) issues.push(`サイズ不足(${(content.length / 1000).toFixed(1)}KB)`)
    if ((content.match(/<svg/g) || []).length < 2) issues.push('SVG不足')
    if ((content.match(/\/pro/g) || []).length < 2) issues.push('CTA不足')
    const links = (content.match(/\(\/blog\/[^)#\s"]+\)/g) || []).length
    if (links < 3) issues.push(`内部リンク${links}本`)
    if (!/^## (よくある質問|FAQ)/m.test(content)) issues.push('FAQ欠如')
    if (issues.length > 0) qualityIssues.push({ slug: post.slug, issues })
  }

  // ── 最近の記事（上位10） ──
  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  const total = posts.length

  return (
    <div className="max-w-5xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tx mb-1">管理ダッシュボード</h1>
          <p className="text-sm text-muted">iwor コンテンツ管理</p>
        </div>
        <Link href="/" className="text-sm text-ac hover:text-ac2 transition-colors">
          ← サイトへ戻る
        </Link>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '総記事数', value: total, color: '#1B4F3A' },
          { label: '公開済み', value: statusCount.published, color: '#166534' },
          { label: '下書き', value: statusCount.draft + statusCount.needs_review, color: '#92400E' },
          { label: '品質問題', value: qualityIssues.length, color: qualityIssues.length === 0 ? '#166534' : '#991B1B' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-s0 border border-br rounded-xl p-5">
            <p className="text-xs text-muted mb-2">{label}</p>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* クラスター別記事数 */}
        <div className="bg-s0 border border-br rounded-xl p-5">
          <h2 className="text-sm font-semibold text-tx mb-4">クラスター別記事数</h2>
          <div className="space-y-2.5">
            {Object.entries(clusterColors)
              .map(([cluster, info]) => ({ cluster, info, count: clusterCount[cluster] || 0 }))
              .sort((a, b) => b.count - a.count)
              .map(({ cluster, info, count }) => (
                <div key={cluster} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: info.bg }} />
                  <span className="text-xs text-muted flex-1 truncate">{info.name}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1.5 rounded-full opacity-70"
                      style={{ width: `${Math.max(4, (count / total) * 120)}px`, backgroundColor: info.bg }}
                    />
                    <span className="text-xs font-medium text-tx w-5 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 品質チェック */}
        <div className="bg-s0 border border-br rounded-xl p-5">
          <h2 className="text-sm font-semibold text-tx mb-4 flex items-center justify-between">
            品質チェック
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              qualityIssues.length === 0 ? 'bg-okl text-ok' : 'bg-dnl text-dn'
            }`}>
              {qualityIssues.length === 0 ? '全記事クリア' : `${qualityIssues.length}件の問題`}
            </span>
          </h2>
          {qualityIssues.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">
              🎉 全{total}本が品質基準をクリアしています
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {qualityIssues.map(({ slug, issues }) => (
                <div key={slug} className="text-xs border border-br rounded-lg p-2.5">
                  <Link
                    href={`/blog/${slug}`}
                    target="_blank"
                    className="font-medium text-tx hover:text-ac transition-colors truncate block mb-1"
                  >
                    {slug}
                  </Link>
                  <div className="flex flex-wrap gap-1">
                    {issues.map(issue => (
                      <span key={issue} className="bg-dnl text-dn px-1.5 py-0.5 rounded text-[10px]">
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 最近の記事 */}
      <div className="bg-s0 border border-br rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-tx mb-4">最近の記事（新着10本）</h2>
        <div className="divide-y divide-br">
          {recentPosts.map((post) => {
            const cat = categories[post.category as keyof typeof categories]
            const color = cat ? clusterColors[cat.cluster as keyof typeof clusterColors]?.bg : '#6B6760'
            return (
              <div key={post.slug} className="py-2.5 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[11px] text-muted w-24 flex-shrink-0">{post.date}</span>
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="text-sm text-tx hover:text-ac transition-colors truncate flex-1"
                >
                  {post.title}
                </Link>
                <span className="text-[11px] text-muted flex-shrink-0">{post.readingTime}分</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* クイックリンク */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'PROコード管理', href: '/admin/pro-codes' },
          { label: '競合監視', href: '/admin/competitors' },
          { label: 'SEOヘルスチェック', href: '/admin/seo-health' },
          { label: 'ブログ一覧', href: '/blog' },
          { label: 'サイトマップ', href: '/sitemap.xml' },
          { label: '画像サイトマップ', href: '/image-sitemap.xml' },
        ].map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            target="_blank"
            className="bg-s0 border border-br rounded-lg p-3 text-sm text-muted hover:text-ac hover:border-ac transition-colors text-center"
          >
            {label} →
          </Link>
        ))}
      </div>
    </div>
  )
}
