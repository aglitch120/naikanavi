import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '臨床ツール — iwor',
  description: '臨床計算79種、生活習慣病総合管理、ER対応6本、ACLS/BLS 4本、ICU管理4本、検査読影5本、薬剤比較25カテゴリ。すべて無料。',
}

// ── ツールカテゴリ（臨床ツールのみ） ──
const categories = [
  {
    slug: 'calc',
    icon: '🧮',
    name: '臨床計算ツール',
    description: '循環器・腎臓・呼吸器・神経・血液など診療科別に79種',
    count: 92,
    badge: null,
    available: true,
  },
  {
    slug: 'lifestyle',
    icon: '🩺',
    name: '生活習慣病 総合管理',
    description: '7疾患を一括評価→次のアクション自動生成',
    count: null,
    badge: 'NEW',
    available: true,
  },
  {
    slug: 'er',
    icon: '🚨',
    name: 'ER・救急対応',
    description: 'ER主訴別対応20本 + ACLS/BLS 4本。胸痛・意識障害・腹痛・失神・発熱・呼吸困難・けいれん・めまい・頭痛・腰背部痛・吐血下血・動悸・嘔吐・咽頭痛・喀血・脱力・咳・下痢・しびれ・院内発熱',
    count: 24,
    badge: 'NEW',
    available: true,
  },
  {
    slug: 'icu',
    icon: '🫁',
    name: 'ICU管理',
    description: '人工呼吸器・昇圧剤・栄養計算・鎮静/鎮痛/せん妄評価',
    count: 4,
    badge: 'NEW',
    available: true,
  },
  {
    slug: 'interpret',
    icon: '🔬',
    name: '検査読影',
    description: '血ガス・心電図・胸部X線・腹部エコー・体液検査の系統的読影フロー。',
    count: 5,
    badge: 'NEW',
    available: true,
  },
  {
    slug: 'antibiotics',
    icon: '💊',
    name: '抗菌薬ガイド',
    description: 'スペクトラム一覧 + 感染症別エンピリック選択。18薬剤 × 7感染症カテゴリ',
    count: 18,
    badge: 'NEW',
    available: true,
  },
]

function CategoryCard({ cat }: { cat: typeof categories[0] }) {
  const inner = (
    <>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-ac/10 border border-ac/20 rounded-xl flex items-center justify-center">
          <span className="text-xl">{cat.icon}</span>
        </div>
        <div className="flex gap-1.5">
          {cat.count && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-ac/10 text-ac font-medium">
              {cat.count}個
            </span>
          )}
          {cat.badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              cat.badge === 'PRO' ? 'bg-[#FFF8E1] text-[#E65100]' :
              cat.badge === 'NEW' ? 'bg-ac/10 text-ac' :
              'bg-s2 text-muted'
            }`}>
              {cat.badge}
            </span>
          )}
        </div>
      </div>
      <h2 className="text-base font-bold text-tx group-hover:text-ac transition-colors">
        {cat.name}
      </h2>
      <p className="text-sm text-muted mt-1">{cat.description}</p>
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
