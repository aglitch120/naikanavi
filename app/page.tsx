import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/mdx'
import ArticleCard from '@/components/blog/ArticleCard'
import { AppMockup } from '@/components/AppMockup'

export const metadata: Metadata = {
  title: 'iwor（イウォル）— 医学生から医師まで、ずっと臨床のそばに',
  description: '臨床計算ツール79種、ER対応、ACLS/BLS、ICU管理、検査読影、薬剤比較155種。病棟TODO、J-OSLER管理、マッチング対策、論文フィード。医学生から医師まで、すべてがここに。',
  alternates: { canonical: 'https://iwor.jp' },
}

export default function HomePage() {
  const latestPosts = getAllPosts().slice(0, 4)

  return (
    <div className="max-w-5xl mx-auto">

      {/* ═══ Hero ═══ */}
      <section className="pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="flex flex-col md:flex-row md:items-center md:gap-12">
          {/* 左: テキスト */}
          <div className="flex-1 mb-10 md:mb-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-acl border border-ac/15 rounded-full text-xs font-medium text-ac mb-6">
              <span className="w-1.5 h-1.5 bg-ac rounded-full animate-pulse" />
              123個の臨床ツール + 173記事
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-tx leading-[1.15] tracking-tight mb-5">
              医学生から医師まで、
              <br />
              ずっと臨床のそばに。
            </h1>
            <p className="text-base text-muted leading-relaxed max-w-md mb-8">
              臨床ツール、病棟管理、学習、キャリア支援。
              必要なものが、すべてひとつの場所に。
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/tools"
                className="inline-flex items-center justify-center bg-ac text-white px-7 py-3.5 rounded-xl font-medium text-sm hover:bg-ac2 transition-colors shadow-lg shadow-ac/15"
              >
                ツールを使ってみる
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/pro"
                className="inline-flex items-center justify-center text-tx border border-br px-7 py-3.5 rounded-xl font-medium text-sm hover:border-ac/30 hover:bg-acl transition-colors"
              >
                PRO会員について
              </Link>
            </div>
          </div>

          {/* 右: アプリモックアップ */}
          <div className="flex-1 relative max-w-[480px] md:max-w-none">
            <AppMockup className="w-full" />
          </div>
        </div>
      </section>

      {/* ═══ Numbers ═══ */}
      <section className="border-y border-br py-8 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {[
            { num: '123', label: '臨床ツール', sub: 'すべて無料' },
            { num: '173', label: '記事', sub: 'ブログ' },
            { num: '155', label: '薬剤', sub: '比較データベース' },
            { num: '7', label: 'サービス', sub: 'ひとつのプラン' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-3xl md:text-4xl font-bold text-tx tracking-tight">{item.num}</p>
              <p className="text-sm font-medium text-tx mt-0.5">{item.label}</p>
              <p className="text-xs text-muted">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Services ═══ */}
      <section className="mb-24">
        <div className="mb-10">
          <p className="text-xs tracking-[0.15em] uppercase text-muted font-mono mb-3">Services</p>
          <h2 className="text-2xl md:text-3xl font-bold text-tx tracking-tight">
            ひとつのプラットフォームで、すべてを。
          </h2>
        </div>

        {/* ── メインカード: 臨床ツール ── */}
        <Link
          href="/tools"
          className="group block mb-5 rounded-xl border border-br bg-s0 hover:border-ac/30 transition-all overflow-hidden"
        >
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-tx group-hover:text-ac transition-colors mb-1">
                  臨床ツール
                </h3>
                <p className="text-sm text-muted">計算・ER対応・ACLS/BLS・ICU管理・検査読影・薬剤比較</p>
              </div>
              <span className="text-xs font-medium text-ac bg-acl px-2.5 py-1 rounded-md flex-shrink-0">
                FREE
              </span>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
              {[
                { name: '臨床計算', count: '79' },
                { name: 'ER対応', count: '6' },
                { name: 'ACLS/BLS', count: '4' },
                { name: 'ICU管理', count: '4' },
                { name: '検査読影', count: '5' },
                { name: '薬剤比較', count: '25' },
              ].map(t => (
                <div key={t.name} className="bg-s1 rounded-lg p-3 text-center group-hover:bg-acl/50 transition-colors">
                  <p className="text-xl font-bold text-tx leading-none mb-0.5">{t.count}</p>
                  <p className="text-[10px] text-muted font-medium">{t.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 md:px-8 py-3 border-t border-br flex items-center justify-between">
            <p className="text-xs text-muted truncate mr-4">CHA₂DS₂-VASc, eGFR, SOFA, Wells PE, A-DROP, qSOFA, FIB-4 ...</p>
            <span className="text-xs text-muted group-hover:text-ac transition-colors whitespace-nowrap flex items-center gap-1">
              すべて見る
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </Link>

        {/* ── 6サービス: ミニマルカード ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            {
              href: '/dashboard',
              title: '病棟TODO & 症例ログ',
              sub: 'タスク管理 & 症例ログ',
              tag: 'PRO',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="#1B4F3A" strokeWidth={1.8} viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              ),
            },
            {
              href: '/learning',
              title: '学習',
              sub: '内科専門医試験対策',
              tag: 'PRO',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="#1B4F3A" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                </svg>
              ),
            },
            {
              href: '/josler',
              title: 'J-OSLER管理',
              sub: '症例登録 & 進捗管理',
              tag: 'PRO',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="#1B4F3A" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                </svg>
              ),
            },
            {
              href: '/matching',
              title: 'マッチング対策',
              sub: '履歴書 & AI面接',
              tag: 'PRO',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="#1B4F3A" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
                </svg>
              ),
            },
            {
              href: '/journal',
              title: '論文フィード',
              sub: '日本語要約 & ブックマーク',
              tag: 'FREEMIUM',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="#1B4F3A" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" />
                </svg>
              ),
            },
            {
              href: '/blog',
              title: 'ブログ',
              sub: 'J-OSLER & キャリア 173記事',
              tag: 'FREE',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="#1B4F3A" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  <path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
                </svg>
              ),
            },
          ].map(s => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex flex-col items-center text-center rounded-xl border border-br bg-s0 p-6 hover:border-ac/30 hover:bg-acl/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-acl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                {s.icon}
              </div>
              <h3 className="text-sm font-bold text-tx mb-1 group-hover:text-ac transition-colors">{s.title}</h3>
              <p className="text-[11px] text-muted mb-2">{s.sub}</p>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                s.tag === 'FREE'
                  ? 'text-ac bg-acl'
                  : s.tag === 'FREEMIUM'
                    ? 'text-muted bg-s1'
                    : 'text-ac/70 bg-acl/60'
              }`}>
                {s.tag}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ Blog ═══ */}
      <section className="mb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs tracking-[0.15em] uppercase text-muted font-mono mb-3">Content</p>
            <h2 className="text-2xl md:text-3xl font-bold text-tx tracking-tight">最新の記事</h2>
          </div>
          <Link
            href="/blog"
            className="text-sm text-muted hover:text-ac transition-colors flex items-center gap-1"
          >
            すべて見る
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {latestPosts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {latestPosts.map(post => (
              <ArticleCard key={post.slug} post={post} compact />
            ))}
          </div>
        )}
      </section>

      {/* ═══ PRO CTA ═══ */}
      <section className="mb-12">
        <div className="rounded-xl border border-ac/15 bg-gradient-to-br from-acl/60 via-s0 to-bg p-8 md:p-12">
          <div className="max-w-lg">
            <p className="text-xs tracking-[0.15em] uppercase text-ac font-mono mb-4">iwor PRO</p>
            <h2 className="text-2xl md:text-3xl font-bold text-tx tracking-tight mb-4">
              すべての機能を、<br />ひとつのプランで。
            </h2>
            <p className="text-sm text-muted leading-relaxed mb-8">
              解釈・アクションプラン・病棟管理・学習・J-OSLER・マッチング・論文フィード。
              月額換算 約817円で、臨床とキャリアのすべてにアクセス。
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/pro"
                className="inline-flex items-center justify-center bg-ac text-white px-7 py-3.5 rounded-xl font-medium text-sm hover:bg-ac2 transition-colors shadow-lg shadow-ac/15"
              >
                プランを見る
              </Link>
              <Link
                href="/pro/activate"
                className="inline-flex items-center justify-center text-tx border border-br px-7 py-3.5 rounded-xl font-medium text-sm hover:border-ac/30 hover:bg-acl transition-colors"
              >
                ログイン / 会員登録
              </Link>
            </div>
            <p className="text-xs text-muted mt-4">¥9,800/年〜 · クレジットカード・PayPay・コンビニ払い</p>
          </div>
        </div>
      </section>
    </div>
  )
}
