import type { Metadata } from 'next'
import Link from 'next/link'
import UpdatedAt from '@/components/tools/UpdatedAt'

export const metadata: Metadata = {
  title: '薬剤比較表 | iwor',
  description: '臨床現場で頻用される薬剤を添付文書情報に基づき一覧比較。DOAC・スタチン・ARB・PPI・SGLT2阻害薬など25カテゴリ。',
}

const categories = [
  {
    group: '循環器',
    items: [
      { href: '/compare/doac', name: 'DOAC（直接経口抗凝固薬）', count: 4, live: true },
      { href: '/compare/arb', name: 'ARB（アンジオテンシンII受容体拮抗薬）', count: 7, live: true },
      { href: '/compare/statin', name: 'スタチン（HMG-CoA還元酵素阻害薬）', count: 6, live: true },
      { href: '/compare/ccb', name: 'Ca拮抗薬', count: 7, live: true },
      { href: '/compare/beta-blocker', name: 'β遮断薬', count: 7, live: true },
      { href: '/compare/diuretic', name: '利尿薬', count: 7, live: true },
      { href: '/compare/antiplatelet', name: '抗血小板薬', count: 6, live: true },
    ]
  },
  {
    group: '代謝・内分泌',
    items: [
      { href: '/compare/sglt2i', name: 'SGLT2阻害薬', count: 6, live: true },
      { href: '/compare/dpp4i', name: 'DPP-4阻害薬', count: 7, live: true },
      { href: '/compare/glp1ra', name: 'GLP-1受容体作動薬', count: 6, live: true },
      { href: '/compare/urate', name: '尿酸降下薬', count: 5, live: true },
    ]
  },
  {
    group: '消化器',
    items: [
      { href: '/compare/ppi', name: 'PPI（プロトンポンプ阻害薬）', count: 5, live: true },
      { href: '/compare/laxative', name: '便秘薬', count: 7, live: true },
    ]
  },
  {
    group: '感染症',
    items: [
      { href: '/compare/cephalosporin', name: 'セフェム系抗菌薬', count: 6, live: true },
      { href: '/compare/quinolone', name: 'キノロン系抗菌薬', count: 6, live: true },
    ]
  },
  {
    group: '精神・神経',
    items: [
      { href: '/compare/ssri-snri', name: 'SSRI / SNRI', count: 7, live: true },
      { href: '/compare/bzd', name: 'ベンゾジアゼピン系', count: 6, live: true },
      { href: '/compare/hypnotic', name: '睡眠薬', count: 7, live: true },
      { href: '/compare/aed', name: '抗てんかん薬', count: 6, live: true },
    ]
  },
  {
    group: '鎮痛・抗炎症',
    items: [
      { href: '/compare/nsaids', name: 'NSAIDs', count: 7, live: true },
      { href: '/compare/steroid', name: '経口ステロイド', count: 6, live: true },
    ]
  },
  {
    group: '呼吸器・アレルギー',
    items: [
      { href: '/compare/inhaler', name: '吸入薬（ICS/LABA/LAMA）', count: 7, live: true },
      { href: '/compare/antihistamine', name: '抗ヒスタミン薬', count: 8, live: true },
    ]
  },
  {
    group: 'その他',
    items: [
      { href: '/compare/iron', name: '鉄剤', count: 5, live: true },
    ]
  },
]

export default function ComparePage() {
  const liveCount = categories.reduce((sum, cat) => sum + cat.items.filter(i => i.live).length, 0)
  const totalCount = categories.reduce((sum, cat) => sum + cat.items.length, 0)

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <span>薬剤比較</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-tx mb-2">薬剤比較表</h1>
        <p className="text-muted text-sm">
          臨床現場で頻用される薬剤を添付文書の公開情報に基づき一覧比較。{liveCount}カテゴリ公開中 / {totalCount}カテゴリ予定。
        </p>
        <UpdatedAt />
      </header>

      <div className="bg-wnl border border-wnb rounded-lg p-3 mb-6 text-sm text-wn">
        ⚠️ 全データは添付文書の公開情報に基づきます。用量は意図的に省略しています。処方時は最新の添付文書をご確認ください。
      </div>

      <div className="space-y-6">
        {categories.map(cat => (
          <section key={cat.group}>
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-2">{cat.group}</h2>
            <div className="grid gap-2">
              {cat.items.map(item => item.live ? (
                <Link key={item.href} href={item.href}
                  className="group flex items-center justify-between p-3 bg-s0 border border-ac/10 rounded-xl hover:border-ac/30 hover:bg-acl transition-colors">
                  <div>
                    <span className="text-sm font-medium text-tx group-hover:text-ac transition-colors">{item.name}</span>
                    {item.count > 0 && <span className="text-xs text-muted ml-2">{item.count}剤</span>}
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-ac/10 text-ac font-bold">NEW</span>
                </Link>
              ) : (
                <div key={item.href} className="flex items-center justify-between p-3 bg-s1/50 border border-br/50 rounded-xl opacity-50">
                  <span className="text-sm text-muted">{item.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-s2 text-muted font-bold">準備中</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
