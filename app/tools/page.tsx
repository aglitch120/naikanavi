import type { Metadata } from 'next'
import Link from 'next/link'
import { ToolsTutorial } from "@/components/tutorials"

export const metadata: Metadata = {
  title: '臨床ツール — iwor',
  description: '臨床計算ツール152種、生活習慣病総合管理、薬剤ガイド、薬剤比較、手技ガイド、基準値早見表、γ計算。すべて無料。',
}

// ── ツールカテゴリ（臨床ツールのみ） ──
const categories = [
  {
    slug: 'calc',
    icon: '🧮',
    name: '臨床計算ツール',
    description: '循環器・腎臓・呼吸器・神経・血液など152種+',
    href: '/tools/calc',
  },
  {
    slug: 'drugs',
    icon: '💊',
    name: '薬剤ガイド',
    description: '抗菌薬・ステロイド・オピオイド・腎機能別用量・術前休薬・簡易懸濁',
    href: '/tools/drugs',
  },
  {
    slug: 'compare',
    icon: '⚖️',
    name: '薬剤比較',
    description: '24カテゴリ155薬剤の比較表',
    href: '/compare',
  },
  {
    slug: 'procedures',
    icon: '🔧',
    name: '手技ガイド',
    description: '採血・挿管・CVC・腰椎穿刺・胸腔ドレーンなど15手技',
    href: '/tools/procedures',
  },
  {
    slug: 'lab-values',
    icon: '📋',
    name: '基準値早見表',
    description: '血液検査・尿検査の基準値一覧',
    href: '/tools/interpret/lab-values',
  },
  {
    slug: 'gamma',
    icon: '💉',
    name: 'γ計算',
    description: '昇圧薬・鎮静薬15種の流量⇔γ換算',
    href: '/tools/icu/gamma',
  },
]

function CategoryCard({ cat }: { cat: typeof categories[0] }) {
  return (
    <Link href={cat.href} className="group block p-5 rounded-xl border border-ac/15 bg-s0 hover:border-ac/40 hover:bg-acl transition-all">
      <div className="w-10 h-10 bg-ac/10 border border-ac/20 rounded-xl flex items-center justify-center mb-3">
        <span className="text-xl">{cat.icon}</span>
      </div>
      <h2 className="text-sm font-bold text-tx group-hover:text-ac transition-colors">
        {cat.name}
      </h2>
      <p className="text-xs text-muted mt-1">{cat.description}</p>
    </Link>
  )
}

export default function ToolsHubPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 mb-3 text-xs text-muted">
          <Link href="/" className="hover:text-ac transition-colors">ホーム</Link>
          <span>›</span>
          <span className="text-tx font-medium">臨床ツール</span>
        </nav>
        <h1 className="text-xl font-bold text-tx">臨床ツール</h1>
        <p className="text-xs text-muted mt-0.5">
          計算・薬剤・手技・基準値 — すべて<span className="font-bold text-ac">無料</span>。
        </p>
      </div>

      {/* カテゴリグリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <CategoryCard key={cat.slug} cat={cat} />
        ))}
      </div>
    <ToolsTutorial />
    </main>
  )
}
