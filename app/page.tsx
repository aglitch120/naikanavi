import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/mdx'
import ArticleCard from '@/components/blog/ArticleCard'
import HomeSearch from '@/components/HomeSearch'
import HomeAppGrid from '@/components/HomeAppGrid'

export const metadata: Metadata = {
  title: 'iwor（イウォール）— 医師のためのワークスペース',
  description: '臨床計算ツール166種、薬剤ガイド・比較、手技ガイド、基準値早見表、γ計算。J-OSLER管理、マッチング・転職対策、論文フィード、医学フラッシュカード。医学生から医師まで。',
  alternates: { canonical: 'https://iwor.jp' },
}

const apps = [
  {
    href: '/tools',
    label: '臨床ツール',
    badge: 'FREE',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  },
  {
    href: '/josler',
    label: '研修記録',
    badge: 'PRO',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10M18 20V4M6 20v-4" />
      </svg>
    ),
  },
  {
    href: '/credits',
    label: '専門医単位',
    badge: '準備中',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    href: '/conferences',
    label: '学会カレンダー',
    badge: '準備中',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: '/matching',
    label: 'マッチング',
    badge: 'FREE',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
      </svg>
    ),
  },
  {
    href: '/journal',
    label: '論文フィード',
    badge: 'FREE',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" />
      </svg>
    ),
  },
  {
    href: '/presenter',
    label: 'プレゼン資料',
    badge: 'PRO',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    href: '/study',
    label: 'Study',
    badge: 'NEW',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 6.253v13M12 6.253C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: '/money',
    label: 'マネー',
    badge: 'NEW',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    href: '/shift',
    label: '当直シフト',
    badge: 'NEW',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
]

export default function HomePage() {
  const latestPosts = getAllPosts().slice(0, 4)

  return (
    <div className="max-w-5xl mx-auto">

      {/* ═══ Hero ═══ */}
      <section className="pt-10 pb-6 md:pt-14 md:pb-8 text-center px-4">
        <p className="text-sm text-muted mb-2 tracking-wide">iwor（イウォール）</p>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-tx leading-[1.2] tracking-tight mb-3">
          医師のためのワークスペース
        </h1>
        <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">
          臨床ツール、キャリア支援、学習、マネー。
          必要なものが、すべてひとつの場所に。
        </p>
      </section>

      {/* ═══ Search ═══ */}
      <section className="px-4 mb-8">
        <HomeSearch />
      </section>

      {/* ═══ App Grid (10 icons: 3cols mobile / 5cols desktop) ═══ */}
      <section className="px-4 mb-12">
        <HomeAppGrid apps={apps} />
      </section>

      {/* ═══ Quick Stats ═══ */}
      <section className="px-4 mb-12">
        <div className="flex items-center justify-center gap-6 md:gap-10 text-center">
          {[
            { num: '166+', label: '計算ツール' },
            { num: '155', label: '薬剤比較' },
            { num: '173', label: 'ブログ記事' },
            { num: '15', label: '手技ガイド' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-lg md:text-xl font-bold text-ac">{s.num}</p>
              <p className="text-[10px] text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Blog ═══ */}
      <section className="px-4 mb-12">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-0.5 bg-muted rounded-full" />
            <h2 className="text-lg font-bold text-tx">最新の記事</h2>
          </div>
          <Link href="/blog" className="text-xs text-ac font-medium hover:underline">すべて見る →</Link>
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
      <section className="px-4 mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-ac/30 rounded-2xl translate-y-2 blur-xl" />
          <div className="relative bg-ac rounded-2xl p-8 md:p-10 text-center overflow-hidden shadow-2xl">
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/[0.04] rounded-full" />
              <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-white/[0.03] rounded-full" />
            </div>
            <div className="relative z-10">
              <p className="text-white/40 text-xs mb-2 tracking-widest uppercase font-mono">iwor PRO</p>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
                すべての機能を、ひとつのプランで。
              </h2>
              <p className="text-white/60 text-sm mb-6 max-w-lg mx-auto leading-relaxed">
                J-OSLER管理・マッチング対策・論文フィード・お気に入り保存。
                <br className="hidden sm:inline" />
                月あたり約¥550〜ですべてにアクセス。
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/pro"
                  className="inline-flex items-center justify-center bg-white text-ac px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors shadow-lg"
                >
                  プランを見る
                </Link>
                <Link
                  href="/pro/activate"
                  className="inline-flex items-center justify-center bg-white/10 text-white border border-white/20 px-7 py-3.5 rounded-xl font-medium text-sm hover:bg-white/20 transition-colors"
                >
                  ログイン / 会員登録
                </Link>
              </div>
              <p className="text-white/25 text-xs mt-4">クレジットカード・PayPay・コンビニ払い対応</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 免責 ═══ */}
      <section className="mb-4 px-4">
        <div className="bg-s1 rounded-xl p-4 text-[11px] text-muted leading-relaxed space-y-1">
          <p>⚠️ 本サービスは医療従事者向けです。<strong className="text-tx">患者の氏名・ID等の個人情報を入力しないでください。</strong></p>
          <p>臨床判断の補助を目的としており、診断・治療の最終判断は担当医が行ってください。情報の正確性は保証いたしません。</p>
          <p>マネーツールの計算結果は概算・目安であり、正確な金額は税理士・所轄税務署にご確認ください。</p>
        </div>
      </section>
    </div>
  )
}
