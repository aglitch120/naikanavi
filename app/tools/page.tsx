import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '臨床ツール',
  description: '内科外来・ER・病棟のすべてをカバー。臨床計算79種、生活習慣病総合管理、抗菌薬調整、ACLS、ER対応、J-OSLER管理など。',
}

// ── 目玉ツール ──
const featured = {
  href: '/tools/lifestyle',
  name: '生活習慣病 総合管理ツール',
  desc: '高血圧・糖尿病・脂質異常症・CKD・肝障害・高尿酸血症・肥満 — 検査値を入力するだけで、疾患評価・管理目標・次のアクション・生活指導が自動生成。二次性高血圧/SAS/FHスクリーニング提案付き。',
}

// ── ツールカテゴリ ──
const categories = [
  {
    slug: 'calc',
    icon: '🧮',
    name: '臨床計算ツール',
    description: '循環器・腎臓・呼吸器・神経・血液など診療科別に79種',
    count: 79,
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
    name: '主訴別ER対応',
    description: '胸痛・意識障害・腹痛・失神・発熱・呼吸困難 — クリック式対応ツリー',
    count: 6,
    badge: 'NEW',
    available: true,
  },
  {
    slug: 'acls',
    icon: '❤️‍🔥',
    name: 'ACLS / BLS',
    description: '心停止・頻脈・徐脈・BLS — AHAガイドライン準拠フロー',
    count: 4,
    badge: 'NEW',
    available: true,
  },
  {
    slug: 'icu',
    icon: '🫁',
    name: 'ICU管理',
    description: '人工呼吸器・昇圧剤・栄養計算・鎮静管理',
    count: null,
    badge: '準備中',
    available: false,
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
    description: '主要薬剤のeGFR/CCr別推奨用量・スペクトラム',
    count: null,
    badge: '準備中',
    available: false,
  },
  {
    slug: 'ward',
    icon: '📋',
    name: '病棟管理',
    description: '患者TODO・採血・輸液・メモ',
    count: null,
    badge: 'PRO',
    available: false,
  },
  {
    slug: 'journal',
    icon: '📰',
    name: '論文フィード',
    description: '最新論文の日本語要約・自動配信',
    count: null,
    badge: '準備中',
    available: false,
  },
  {
    slug: 'josler',
    icon: '📝',
    name: 'J-OSLER管理',
    description: '症例登録・進捗トラッカー・病歴要約',
    count: null,
    badge: 'PRO',
    available: false,
  },
  {
    slug: 'study',
    icon: '📖',
    name: '臨床トレーニング',
    description: '症例ベースの問題演習・知識整理',
    count: null,
    badge: '準備中',
    available: false,
  },
  {
    slug: 'diagnosis',
    icon: '🩻',
    name: '専門科診断',
    description: '20問であなたに合う専門科を診断',
    count: null,
    badge: '準備中',
    available: false,
  },
  {
    slug: 'matching',
    icon: '🎓',
    name: 'マッチング対策',
    description: '病院DB・倍率表・面接対策・履歴書生成',
    count: null,
    badge: '準備中',
    available: false,
  },
]

function CategoryCard({ cat }: { cat: typeof categories[0] }) {
  const inner = (
    <>
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{cat.icon}</span>
        <div className="flex gap-1.5">
          {cat.count && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-ac/10 text-ac font-medium">
              {cat.count}個
            </span>
          )}
          {cat.badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              cat.badge === 'PRO' ? 'bg-[#FFF8E1] text-[#E65100]' :
              cat.badge === 'NEW' ? 'bg-[#E6F4EA] text-[#1B5E20]' :
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
      <Link href={href} className="group block p-5 rounded-xl border border-br bg-s1 hover:border-ac/40 hover:bg-acl transition-colors">
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
          臨床医が必要なものがすべて揃う。計算・判断・緊急系はすべて<span className="font-bold text-ac">無料</span>。
        </p>
      </div>

      {/* 目玉: 生活習慣病 総合管理 */}
      <Link
        href={featured.href}
        className="group block mb-8 p-6 rounded-2xl border-2 border-ac/30 bg-gradient-to-br from-acl/50 to-bg hover:border-ac/60 transition-all"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-ac text-white font-bold">NEW</span>
          <span className="text-xs text-ac font-medium">内科外来の決定版</span>
        </div>
        <h2 className="text-xl font-bold text-tx group-hover:text-ac transition-colors mb-2">
          {featured.name}
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          {featured.desc}
        </p>
        <span className="inline-block mt-3 text-sm text-ac font-medium">使ってみる →</span>
      </Link>

      {/* カテゴリグリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <CategoryCard key={cat.slug} cat={cat} />
        ))}
      </div>
    </main>
  )
}
