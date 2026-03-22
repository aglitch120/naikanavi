import type { Metadata } from 'next'
import Link from 'next/link'
import { ToolsTutorial } from "@/components/tutorials"
import { tools, implementedTools } from '@/lib/tools-config'

export const metadata: Metadata = {
  title: '臨床計算ツール178種 無料 — iwor',
  description: 'eGFR・CHA2DS2-VASc・Child-Pugh・CURB-65・Wells・SOFA・BMI・A-DROP等178種の臨床計算ツール。薬剤ガイド・比較25種、手技ガイド15種、基準値早見表。すべて無料。医師・研修医向け。',
}

const categories = [
  {
    slug: 'calc',
    icon: '🧮',
    name: '臨床計算ツール',
    description: '循環器・腎臓・呼吸器・神経・血液など',
    href: '/tools/calc',
  },
  {
    slug: 'drugs',
    icon: '💊',
    name: '薬剤ガイド',
    description: '抗菌薬・ステロイド・オピオイド・腎機能別用量・薬剤比較',
    href: '/tools/drugs',
  },
  {
    slug: 'procedures',
    icon: '🔧',
    name: '手技ガイド',
    description: '採血・挿管・CVC・腰椎穿刺・胸腔ドレーンなど',
    href: '/tools/procedures',
  },
  {
    slug: 'lab-values',
    icon: '📋',
    name: '基準値早見表',
    description: '血液検査・尿検査の基準値一覧',
    href: '/tools/interpret/lab-values',
  },
]

export default function ToolsHubPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 mb-3 text-xs text-muted">
          <Link href="/" className="hover:text-ac transition-colors">ホーム</Link>
          <span>&rsaquo;</span>
          <span className="text-tx font-medium">臨床ツール</span>
        </nav>
        <h1 className="text-xl font-bold text-tx">臨床ツール</h1>
        <p className="text-xs text-muted mt-0.5">
          計算・薬剤・手技・基準値 — すべて<span className="font-bold text-ac">無料</span>。
        </p>
      </div>

      {/* カテゴリグリッド — 4カード、レスポンシブ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {categories.map(cat => (
          <Link key={cat.slug} href={cat.href}
            className="group block p-4 md:p-5 rounded-xl border border-ac/15 bg-s0 hover:border-ac/40 hover:bg-acl transition-all">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-ac/10 border border-ac/20 rounded-xl flex items-center justify-center mb-3">
              <span className="text-xl md:text-2xl">{cat.icon}</span>
            </div>
            <h2 className="text-sm font-bold text-tx group-hover:text-ac transition-colors leading-tight">
              {cat.name}
            </h2>
            <p className="text-[11px] text-muted mt-1 leading-relaxed hidden sm:block">{cat.description}</p>
          </Link>
        ))}
      </div>
      {/* SEO: 全ツール一覧（折りたたみ — Googlebotにはopen状態で見える） */}
      <details className="mt-8 border-t border-br pt-6 group">
        <summary className="flex items-center justify-between cursor-pointer text-xs text-muted hover:text-ac transition-colors">
          <span>全{implementedTools.size}種の計算ツール一覧</span>
          <span className="group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 mt-3">
          {tools.filter(t => implementedTools.has(t.slug)).map(t => (
            <Link key={t.slug} href={`/tools/calc/${t.slug}`}
              className="px-2.5 py-1.5 rounded text-[11px] text-muted hover:bg-acl hover:text-ac transition-colors truncate">
              {t.name}
            </Link>
          ))}
        </div>
      </details>

      <ToolsTutorial />
    </main>
  )
}
