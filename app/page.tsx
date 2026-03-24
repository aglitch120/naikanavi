import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/mdx'
import ArticleCard from '@/components/blog/ArticleCard'
import HomeSearch from '@/components/HomeSearch'
import HomeAppGrid from '@/components/HomeAppGrid'
import HeroBackground from '@/components/HeroBackground'
import HomeWidgets from '@/components/HomeWidgets'

export const metadata: Metadata = {
  title: 'iwor（イウォール）— 医師のためのワークスペース',
  description: '臨床計算ツール166種、薬剤ガイド・比較、手技ガイド、基準値早見表、γ計算。J-OSLER管理、マッチング・転職対策、論文フィード、医学フラッシュカード。医学生から医師まで。',
  alternates: { canonical: 'https://iwor.jp' },
}

const apps = [
  {
    href: '/tools',
    label: '臨床ツール',
    sub: '計算・薬剤・手技・基準値',
    badge: 'FREE',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  },
  {
    href: '/josler',
    label: 'JOSLER',
    sub: '症例・病歴要約を一元管理',
    badge: 'PRO',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10M18 20V4M6 20v-4" />
      </svg>
    ),
  },
  {
    href: '/josler/summary-generator',
    label: '病歴要約AI',
    sub: 'カルテから病歴要約を自動生成',
    badge: 'NEW',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 15l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/epoc',
    label: 'EPOC',
    sub: '初期研修の経験を記録',
    badge: 'PRO',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: '/credits',
    label: '専門医単位',
    sub: '取得単位をカウント&管理',
    badge: 'PRO',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    href: '/conferences',
    label: '学会カレンダー',
    sub: '主要学会の日程を一覧',
    badge: 'FREE',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: '/matching?tab=interview',
    label: '面接シミュレーションAI',
    sub: 'AIと面接練習・レポート',
    badge: 'NEW',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: '/matching',
    label: 'マッチング・転職',
    sub: '病院選び・履歴書・面接対策',
    badge: 'FREE',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
      </svg>
    ),
  },
  {
    href: '/documents',
    label: '文書支援',
    sub: '紹介状・退院サマリ・カルテ',
    badge: 'NEW',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    href: '/journal',
    label: '論文フィード',
    sub: '主要誌の最新論文を毎日配信',
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
    sub: '抄読会・カンファ資料を即作成',
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
    sub: '医学知識を毎日5分で定着',
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
    sub: 'ふるさと納税・手取り・NISA',
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
    sub: 'シフト自動作成&共有',
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
      <section className="relative pt-12 pb-10 md:pt-20 md:pb-14 text-center px-4 overflow-hidden">
        <HeroBackground />
        <div className="relative z-10">
          <p className="text-sm text-muted mb-2 tracking-wide">iwor（イウォール）</p>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-tx leading-[1.2] tracking-tight mb-3">
            医師のためのワークスペース
          </h1>
          <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">
            臨床ツール、キャリア支援、学習、マネー。
            必要なものが、すべてひとつの場所に。
          </p>
        </div>
      </section>

      {/* ═══ Search ═══ */}
      <section className="px-4 mb-8">
        <HomeSearch />
      </section>

      {/* ═══ Activity Widgets (Zeigarnik + Goal Gradient) ═══ */}
      <section className="px-4 mb-6">
        <HomeWidgets />
      </section>

      {/* ═══ App Grid (10 icons: 3cols mobile / 5cols desktop) ═══ */}
      <section className="px-4 mb-12">
        <HomeAppGrid apps={apps} />
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

      {/* ═══ SEO: サービス説明（折りたたみ — Googlebotには見える） ═══ */}
      <details className="mb-6 px-4">
        <summary className="text-[10px] text-muted/60 cursor-pointer hover:text-muted transition-colors">iworについて</summary>
        <div className="mt-3 space-y-4 text-[11px] text-muted leading-relaxed">
          <p className="text-xs text-tx font-medium">iwor（イウォール）は、医学生・研修医・専攻医・医師のキャリア全体をカバーするオールインワンワークスペースです。CBT対策から臨床現場、専門医取得、転職・開業まで — 医師人生のあらゆる場面で必要なツールがひとつの場所に揃っています。</p>

          <div>
            <p className="text-tx font-bold mb-1">医学生のあなたへ</p>
            <p><strong>マッチング対策</strong> — 全国1,470病院のデータベースで倍率・マッチ率・本命度・穴場度を独自分析。プロフィールウィザードで履歴書・自己PRをAI自動生成。見学申込メール・お礼メールのテンプレートも。<strong>iwor Study</strong> — CBT・国試対策のフラッシュカード。科学的な間隔反復アルゴリズム(FSRS)で効率的に暗記。ストリークランキングで全国の医学生と競える。<strong>プレゼン資料生成</strong> — 学会発表・カンファ・抄読会のスライド構成をテンプレートから即作成。</p>
          </div>

          <div>
            <p className="text-tx font-bold mb-1">初期研修医のあなたへ</p>
            <p><strong>臨床計算ツール 178種</strong> — eGFR・CHA2DS2-VASc・Child-Pugh・CURB-65・Wells・qSOFA・SOFA・BMI・GCS・NIHSS・APACHE II等。当直中にすぐ使える。すべて無料・登録不要。<strong>薬剤ガイド・比較表 25種</strong> — 抗菌薬スペクトラム・腎機能別用量・ステロイド換算・オピオイド換算。DOAC・スタチン・ARB・CCB・SGLT2i・DPP-4i等の薬剤比較。<strong>EPOC管理</strong> — 経験すべき症候29・疾病26・手技14のチェックリスト。達成率を一目で把握。<strong>当直シフト作成</strong> — 救急当直・病棟当直の自動割り当て。NG日アンケートをURLで共有、勤務量バランス・最小間隔も設定可能。</p>
          </div>

          <div>
            <p className="text-tx font-bold mb-1">専攻医のあなたへ</p>
            <p><strong>J-OSLER管理</strong> — 16領域の症例登録数・疾患群数・病歴要約数をカウント。修了要件の達成状況を一目で確認。EPOCからの経験引き継ぎ機能。<strong>病歴要約AIジェネレーター</strong> — カルテのコピペから病歴要約のプロンプトを自動生成。Claude/ChatGPTに貼るだけ。<strong>論文フィード</strong> — NEJM・Lancet・JAMA等211誌の最新論文を日本語タイトル付きで毎日配信。ブックマーク・コメント・抄読会連携。<strong>専門医単位管理</strong> — 複数の専門医を一元管理。カテゴリ別の取得単位をカウント。更新期限リマインダー（90日前・30日前）。単位取得に使える学会・地方会・e-learningの情報も。<strong>学会カレンダー</strong> — 主要学会の日程・演題締切を一覧。参加予定・リマインダー機能。</p>
          </div>

          <div>
            <p className="text-tx font-bold mb-1">医師のあなたへ</p>
            <p><strong>転職対策</strong> — 履歴書・職務経歴書のAI自動生成。書類テンプレート。<strong>マネー</strong> — ふるさと納税上限概算・手取り概算・NISA運用シミュレーター。医師向けクレカ・バイト会社ランキング（準備中）。<strong>プレゼン資料</strong> — 学会発表・カンファ・コンサル用のスライドテンプレート。</p>
          </div>

          <p className="text-[10px]">すべての臨床計算ツール・薬剤ガイドは無料・登録不要でご利用いただけます。J-OSLER管理・論文フィード・マッチング対策も基本機能は無料。PRO会員（月額¥980〜）で全機能が解放されます。</p>
        </div>
      </details>

      {/* ═══ 免責 ═══ */}
      <section className="mb-4 px-4">
        <div className="bg-s1 rounded-xl p-4 text-[11px] text-muted leading-relaxed space-y-1">
          <p>掲載情報は公式文献の転記であり、正確性は保証しません。必ず原典をご確認ください。</p>
          <p>マネーツールの計算結果は概算・目安であり、正確な金額は税理士・所轄税務署にご確認ください。</p>
        </div>
      </section>
    </div>
  )
}
