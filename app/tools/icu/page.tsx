import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ICU管理ツール｜iwor',
  description: '人工呼吸器初期設定・昇圧剤選択・ICU栄養計算・鎮静/鎮痛/せん妄評価。ICU管理に必要なツールを集約。',
}

const tools = [
  {
    slug: 'ventilator',
    icon: '🫁',
    name: '人工呼吸器 初期設定ガイド',
    desc: 'IBW算出 → 病態別の推奨設定（TV・RR・FiO₂・PEEP）。ARDSNet低容量換気・COPD/喘息のauto-PEEP対策。FiO₂/PEEP対応表付き。',
    keywords: ['IBW', 'ARDS', 'PEEP', 'TV', 'Pplat'],
  },
  {
    slug: 'vasopressor',
    icon: '💉',
    name: 'ICU薬剤 γ計算',
    desc: '昇圧剤・強心薬・鎮静剤・麻薬・降圧剤のγ計算。体重・希釈濃度からmL/hを算出。添付文書準拠のγ範囲表示。',
    keywords: ['γ計算', 'NE', 'ドブタミン', 'プロポフォール', 'フェンタニル', 'ニカルジピン'],
  },
  {
    slug: 'nutrition',
    icon: '🍽️',
    name: 'ICU栄養計算ツール',
    desc: 'ESPEN/ASPENガイドライン準拠。病期・侵襲度・腎/肝機能に基づく必要カロリー・蛋白量。経腸栄養製剤9種の比較表・refeeding risk評価。',
    keywords: ['カロリー', '蛋白', 'EN', 'refeeding'],
  },
  {
    slug: 'sedation',
    icon: '😴',
    name: '鎮静・鎮痛・せん妄評価',
    desc: 'RASS（鎮静深度）、CAM-ICU（せん妄）、BPS/CPOT（疼痛）の4スケールをインタラクティブに評価。PADIS準拠。',
    keywords: ['RASS', 'CAM-ICU', 'BPS', 'CPOT', 'せん妄'],
  },
]

export default function ICUHubPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/tools" className="hover:text-ac">ツール</Link>
        <span>/</span>
        <span className="text-tx font-medium">ICU管理</span>
      </nav>

      <h1 className="text-2xl font-bold text-tx mb-2">ICU管理ツール</h1>
      <p className="text-muted mb-8">
        人工呼吸器・昇圧剤・栄養・鎮静管理 — ICUで必要な計算・評価ツールを集約。
      </p>

      <div className="bg-dnl border-2 border-dnb rounded-xl p-4 mb-8">
        <p className="text-sm font-bold text-dn mb-1">⚠️ 重要</p>
        <p className="text-sm text-dn/90">
          本ツールは臨床判断の補助を目的としています。薬剤の選択・用量・設定値は患者の状態に基づき担当医が決定してください。
        </p>
      </div>

      <div className="space-y-4">
        {tools.map(t => (
          <Link
            key={t.slug}
            href={`/tools/icu/${t.slug}`}
            className="group block p-5 rounded-xl border border-ac/15 bg-s0 hover:border-ac/40 hover:bg-acl transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-ac/10 border border-ac/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{t.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-tx group-hover:text-ac transition-colors mb-1">
                  {t.name}
                </h2>
                <p className="text-sm text-muted leading-relaxed">{t.desc}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {t.keywords.map(k => (
                    <span key={k} className="text-xs px-2 py-0.5 rounded bg-s2 text-muted">{k}</span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 p-4 bg-s1 rounded-xl border border-br">
        <p className="text-xs font-bold text-tx mb-2">参考ガイドライン</p>
        <ul className="text-xs text-muted space-y-1">
          <li>• ARDSNet Protocol / ESPEN ICU Nutrition Guidelines 2019</li>
          <li>• Surviving Sepsis Campaign Guidelines 2021</li>
          <li>• PADIS Guidelines (Critical Care Medicine 2018)</li>
          <li>• 日本集中治療医学会 各種ガイドライン</li>
        </ul>
      </div>
    </main>
  )
}
