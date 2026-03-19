import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'アプリ — iwor',
  description: '臨床ツール、研修記録、マッチング・転職対策、論文フィード、プレゼン資料生成。医師のためのワークスペース。',
}

const services = [
  {
    href: '/tools',
    title: '臨床ツール',
    sub: '計算152種・薬剤ガイド・比較・手技・基準値・γ計算 — すべて無料',
    tag: 'FREE',
    featured: true,
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
    subcategories: ['臨床計算', '薬剤ガイド', '薬剤比較', '手技ガイド', '基準値', 'γ計算'],
  },
  {
    href: '/josler',
    title: 'J-OSLER管理',
    sub: '症例登録 & 進捗管理',
    tag: 'PRO',
    icon: <><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></>,
  },
  {
    href: '/matching',
    title: 'マッチング・転職対策',
    sub: '履歴書 & 病院検索',
    tag: 'PRO',
    icon: <><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" /></>,
  },
  {
    href: '/journal',
    title: '論文フィード',
    sub: '日本語要約 & ブックマーク',
    tag: 'FREEMIUM',
    icon: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" /></>,
  },
  {
    href: '/presenter',
    title: 'プレゼン資料生成',
    sub: '学会・カンファ・コンサル',
    tag: 'PRO',
    icon: <><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><path d="M8 21h8M12 17v4" /></>,
  },
]

export default function AppPage() {
  const featured = services[0]
  const rest = services.slice(1)

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-tx">サービス</h1>
        <p className="text-muted mt-2">
          医学生から医師まで、キャリアのすべてをカバー。
        </p>
      </div>

      {/* 臨床ツール（メインカード） */}
      <Link
        href={featured.href}
        className="group block mb-4 rounded-2xl border border-br bg-s0 overflow-hidden hover:border-ac/40 hover:shadow-md transition-all"
      >
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-ac rounded-xl flex items-center justify-center">
              {featured.icon}
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-tx group-hover:text-ac transition-colors">{featured.title}</h2>
              <p className="text-xs text-muted">{featured.sub}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {featured.subcategories!.map(name => (
              <div key={name} className="bg-acl text-ac border border-ac/15 rounded-lg px-3 py-2.5 text-center">
                <p className="text-xs font-bold">{name}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 md:px-8 py-3 bg-s1 border-t border-br flex items-center justify-between">
          <p className="text-xs text-muted">CHA₂DS₂-VASc, eGFR, SOFA, Wells PE, A-DROP, qSOFA ...</p>
          <span className="text-xs text-ac font-medium group-hover:translate-x-1 transition-transform">使ってみる →</span>
        </div>
      </Link>

      {/* その他サービス */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {rest.map(s => (
          <Link
            key={s.href}
            href={s.href}
            className="group relative rounded-2xl border border-br bg-s0 p-5 md:p-6 hover:border-ac/30 hover:shadow-md transition-all"
          >
            <span className={`absolute top-3 right-3 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-md ${
              s.tag === 'FREE' ? 'text-muted bg-s1 border border-br'
              : s.tag === 'FREEMIUM' ? 'text-muted bg-s1 border border-br'
              : 'text-ac bg-acl border border-ac/15'
            }`}>
              {s.tag}
            </span>
            <div className="w-10 h-10 rounded-xl bg-s1 border border-br flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-ac" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                {s.icon}
              </svg>
            </div>
            <h3 className="text-sm font-bold text-tx mb-1 group-hover:text-ac transition-colors">{s.title}</h3>
            <p className="text-[11px] text-muted leading-relaxed">{s.sub}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
