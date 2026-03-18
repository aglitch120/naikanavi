import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '臨床ツール — iwor',
  description: '臨床計算、生活習慣病総合管理、ER・救急対応、ICU管理、検査読影、薬剤ガイド。すべて無料。',
}

// ── ツールカテゴリ（臨床ツールのみ） ──
const categories = [
  {
    slug: 'calc',
    icon: '🧮',
    name: '臨床計算ツール',
    description: '循環器・腎臓・呼吸器・神経・血液など診療科別',
    available: true,
  },
  {
    slug: 'lifestyle',
    icon: '🩺',
    name: '生活習慣病 総合管理',
    description: '7疾患を一括評価→アクション自動生成',
    available: true,
  },
  {
    slug: 'er',
    icon: '🚨',
    name: 'ER・救急対応',
    description: 'ER主訴別対応 + ACLS/BLS フロー',
    available: true,
  },
  {
    slug: 'icu',
    icon: '🫁',
    name: 'ICU管理',
    description: '人工呼吸器・γ計算・栄養・鎮静評価',
    available: true,
  },
  {
    slug: 'interpret',
    icon: '🔬',
    name: '検査読影',
    description: '血液検査・心電図・X線・CT・エコー・尿検査',
    available: true,
  },
  {
    slug: 'drugs',
    icon: '💊',
    name: '薬剤ガイド',
    description: '抗菌薬・ステロイド・オピオイド・腎機能別用量',
    available: true,
  },
  {
    slug: 'inpatient',
    icon: '🏥',
    name: '入院中トラブル対応',
    description: 'ショック・SpO2低下・せん妄・転倒・血糖異常など10項目',
    available: true,
  },
]

function CategoryCard({ cat }: { cat: typeof categories[0] }) {
  const inner = (
    <>
      <div className="w-10 h-10 bg-ac/10 border border-ac/20 rounded-xl flex items-center justify-center mb-3">
        <span className="text-xl">{cat.icon}</span>
      </div>
      <h2 className="text-sm font-bold text-tx group-hover:text-ac transition-colors">
        {cat.name}
      </h2>
      <p className="text-xs text-muted mt-1">{cat.description}</p>
    </>
  )

  if (cat.available) {
    const href = cat.slug === 'lifestyle' ? '/tools/lifestyle' : `/tools/${cat.slug}`
    return (
      <Link href={href} className="group block p-5 rounded-xl border border-ac/15 bg-s0 hover:border-ac/40 hover:bg-acl transition-all">
        {inner}
      </Link>
    )
  }

  return (
    <div className="p-5 rounded-xl border border-br bg-s1 opacity-60">
      {inner}
    </div>
  )
}

export default function ToolsHubPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-tx">臨床ツール</h1>
        <p className="text-muted mt-2">
          計算・判断・緊急系はすべて<span className="font-bold text-ac">無料</span>。解釈・アクションプランは<span className="font-bold text-ac">PRO</span>。
        </p>
      </div>

      {/* カテゴリグリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <CategoryCard key={cat.slug} cat={cat} />
        ))}
      </div>
    </main>
  )
}
