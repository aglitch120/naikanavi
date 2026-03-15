import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '臨床ツール',
  description: '臨床医が必要なツールがすべて揃う。臨床計算、抗菌薬調整、ACLS/BLS、ER対応、ICU管理、病棟ダッシュボード、論文フィードなど。',
}

const categories = [
  {
    slug: 'calc',
    icon: '🧮',
    name: '臨床計算',
    description: 'eGFR、CHA₂DS₂-VASc、SOFA、Child-Pughなど67種',
    count: 29,
    badge: null,
    available: true,
  },
  {
    slug: 'antibiotics',
    icon: '💊',
    name: '抗菌薬 腎機能別調整',
    description: '主要20薬剤のeGFR/CCr別推奨用量',
    count: null,
    badge: null,
    available: false,
  },
  {
    slug: 'acls',
    icon: '🚨',
    name: 'ACLS / BLS',
    description: '心停止・不整脈・緊急対応フロー',
    count: null,
    badge: '緊急',
    available: false,
  },
  {
    slug: 'er',
    icon: '🏥',
    name: '主訴別ER対応',
    description: '胸痛・意識障害・発熱・腹痛など',
    count: null,
    badge: '緊急',
    available: false,
  },
  {
    slug: 'icu',
    icon: '🫁',
    name: 'ICU管理',
    description: '人工呼吸器・昇圧剤・栄養計算',
    count: null,
    badge: '緊急',
    available: false,
  },
  {
    slug: 'interpret',
    icon: '🔬',
    name: '検査読影',
    description: '血ガス・心電図・画像・エコーの読み方',
    count: null,
    badge: null,
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
    badge: null,
    available: false,
  },
  {
    slug: 'study',
    icon: '📖',
    name: '臨床トレーニング',
    description: '症例ベースの問題演習・知識整理',
    count: null,
    badge: null,
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
    slug: 'diagnosis',
    icon: '🩺',
    name: '専門科診断',
    description: '20問であなたに合う専門科を診断',
    count: null,
    badge: null,
    available: false,
  },
  {
    slug: 'matching',
    icon: '🎓',
    name: 'マッチング対策',
    description: '病院DB・倍率表・面接対策・履歴書生成',
    count: null,
    badge: null,
    available: false,
  },
  {
    slug: 'specialist',
    icon: '🏅',
    name: '他科専門医対策',
    description: '外科・小児科・産婦人科など',
    count: null,
    badge: null,
    available: false,
  },
]

export default function ToolsHubPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-tx">臨床ツール</h1>
        <p className="text-muted mt-2">
          臨床医が必要なものがすべて揃う。計算・判断・緊急系はすべて無料。
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          cat.available ? (
            <Link
              key={cat.slug}
              href={`/tools/${cat.slug}`}
              className="group block p-5 rounded-xl border border-br bg-s1 hover:border-ac/40 hover:bg-acl transition-colors"
            >
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
                      cat.badge === 'PRO' ? 'bg-amber-100 text-amber-700' :
                      cat.badge === '緊急' ? 'bg-red-100 text-red-700' :
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
            </Link>
          ) : (
            <div
              key={cat.slug}
              className="p-5 rounded-xl border border-br bg-s1 opacity-60"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{cat.icon}</span>
                <div className="flex gap-1.5">
                  {cat.badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      cat.badge === 'PRO' ? 'bg-amber-100 text-amber-700' :
                      cat.badge === '緊急' ? 'bg-red-100 text-red-700' :
                      'bg-s2 text-muted'
                    }`}>
                      {cat.badge}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-s2 text-muted font-medium">
                    準備中
                  </span>
                </div>
              </div>
              <h2 className="text-base font-bold text-tx">{cat.name}</h2>
              <p className="text-sm text-muted mt-1">{cat.description}</p>
            </div>
          )
        ))}
      </div>
    </main>
  )
}
