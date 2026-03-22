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

      {/* 管理メニュー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { href: '/admin', label: 'コンテンツ', icon: '📝', active: true },
          { href: '/admin/competitors', label: '競合監視', icon: '🔍' },
          { href: '/admin/seo-health', label: 'SEO', icon: '📊' },
          { href: '/admin/pro-codes', label: 'PROコード', icon: '🔑' },
          { href: '#tools-audit', label: 'ツール巡回', icon: '🔧' },
          { href: '#users', label: 'ユーザー', icon: '👥' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className={`p-3 rounded-xl border text-center text-xs font-medium transition-all ${
              item.active ? 'bg-acl border-ac/30 text-ac' : 'bg-s0 border-br text-muted hover:border-ac/30'
            }`}>
            <span className="text-base block mb-1">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      {/* セキュリティ・売上サマリー（簡易版） */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-s0 border border-br rounded-xl p-4">
          <p className="text-xs text-muted mb-1">PRO会員</p>
          <p className="text-2xl font-bold text-ac">1</p>
          <p className="text-[10px] text-muted">テスト用</p>
        </div>
        <div className="bg-s0 border border-br rounded-xl p-4">
          <p className="text-xs text-muted mb-1">MRR</p>
          <p className="text-2xl font-bold text-tx">¥100</p>
          <p className="text-[10px] text-muted">BOOTH (非公開済み)</p>
        </div>
        <div className="bg-s0 border border-br rounded-xl p-4">
          <p className="text-xs text-muted mb-1">セキュリティ</p>
          <p className="text-2xl font-bold text-ok">正常</p>
          <p className="text-[10px] text-muted">PBKDF2 + レート制限</p>
        </div>
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

      {/* ═══ ツール巡回状況 ═══ */}
      <div id="tools-audit" className="bg-s0 border border-br rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-tx mb-4">ツール確認巡回状況</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-ac">166</p>
            <p className="text-xs text-muted">計算ツール</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-ac">25</p>
            <p className="text-xs text-muted">薬剤比較</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-ac">15</p>
            <p className="text-xs text-muted">手技ガイド</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-tx">0</p>
            <p className="text-xs text-muted">要修正</p>
          </div>
        </div>
        <p className="text-xs text-muted">全ツールの出典照合・数式検証は四半期ごとに実施。次回: 2026年6月</p>
        <p className="text-xs text-muted mt-1">法務対応: explanation全削除済み（2026-03-22）、出典明記・更新日表示・誤り報告ボタン設置済み</p>
      </div>

      {/* ═══ ユーザー管理（簡易） ═══ */}
      <div id="users" className="bg-s0 border border-br rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-tx mb-4">ユーザー管理</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-ac">1</p>
            <p className="text-xs text-muted">PRO会員</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-tx">-</p>
            <p className="text-xs text-muted">FREE登録</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-tx">-</p>
            <p className="text-xs text-muted">今月アクティブ</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted">Worker API: <code className="bg-s1 px-1 rounded text-[10px]">GET /api/admin/users</code></p>
          <p className="text-xs text-muted">注文管理: <code className="bg-s1 px-1 rounded text-[10px]">GET /api/admin/orders</code></p>
          <p className="text-xs text-muted">GA4で詳細分析可能（Cloudflare Web Analytics併用）</p>
        </div>
      </div>

      {/* ═══ SNS投稿状況 ═══ */}
      <div className="bg-s0 border border-br rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-tx mb-4">SNS投稿状況</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-tx">-</p>
            <p className="text-xs text-muted">今月の投稿</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-tx">5</p>
            <p className="text-xs text-muted">週間目標</p>
          </div>
        </div>
        <p className="text-xs text-muted">Xアカウント: 週5投稿目標。計算ツール系 + 試験対策系 + 医師お金系</p>
        <p className="text-xs text-muted mt-1">投稿ネタ: 計算ツールのTips / Study使い方 / J-OSLER対策 / 専門医試験</p>
      </div>
    </div>
  )
}
