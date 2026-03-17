import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ACLS / BLS フローチャート｜iwor',
  description: 'AHAガイドライン準拠の蘇生アルゴリズム。成人BLS、心停止（VF/pVT・Asystole/PEA）、頻脈、徐脈の対応フローをクリック操作で系統的に実施。',
}

const flows = [
  {
    slug: 'bls',
    icon: '🫀',
    name: '成人BLS（一次救命処置）',
    desc: '反応確認 → 119番通報 → CPR → AED。院外心停止の初動対応。',
    nodes: 14,
    keywords: ['CPR', 'AED', '胸骨圧迫', '心肺蘇生'],
  },
  {
    slug: 'cardiac-arrest',
    icon: '⚡',
    name: '心停止アルゴリズム',
    desc: 'VF/pVT（ショック適応）vs Asystole/PEA（非適応）。除細動・アドレナリン・アミオダロン・5H/5T・ROSC後管理。',
    nodes: 15,
    keywords: ['VF', 'pVT', 'Asystole', 'PEA', '除細動', 'ROSC'],
  },
  {
    slug: 'tachycardia',
    icon: '📈',
    name: '頻脈アルゴリズム',
    desc: '安定/不安定 → Narrow/Wide QRS → 整/不整で系統的鑑別。SVT・AF・VT・WPW+AF・Torsades対応。',
    nodes: 18,
    keywords: ['SVT', 'VT', 'AF', 'WPW', 'アデノシン', '同期除細動'],
  },
  {
    slug: 'bradycardia',
    icon: '📉',
    name: '徐脈アルゴリズム',
    desc: 'アトロピン → 経皮ペーシング → 経静脈ペーシング。房室ブロック種類別に永久PM適応を判断。',
    nodes: 12,
    keywords: ['アトロピン', 'ペーシング', 'AVB', 'Mobitz II', '完全房室ブロック'],
  },
]

export default function ACLSHubPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* パンくず */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/tools" className="hover:text-ac">ツール</Link>
        <span>/</span>
        <span className="text-tx font-medium">ACLS / BLS</span>
      </nav>

      <h1 className="text-2xl font-bold text-tx mb-2">ACLS / BLS フローチャート</h1>
      <p className="text-muted mb-8">
        AHA / JRC ガイドライン準拠の蘇生アルゴリズム。クリック操作で分岐を辿り、系統的に対応を進められます。
      </p>

      {/* 免責 */}
      <div className="bg-dnl border-2 border-dnb rounded-xl p-4 mb-8">
        <p className="text-sm font-bold text-dn mb-1">⚠️ 重要</p>
        <p className="text-sm text-dn/90">
          本ツールは医療従事者の思考補助を目的としています。実際の蘇生場面では施設のプロトコル・チームリーダーの指示に従ってください。
        </p>
      </div>

      {/* フロー一覧 */}
      <div className="space-y-4">
        {flows.map(f => (
          <Link
            key={f.slug}
            href={`/tools/acls/${f.slug}`}
            className="group block p-5 rounded-xl border border-ac/15 bg-s0 hover:border-ac/40 hover:bg-acl transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-ac/10 border border-ac/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{f.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-bold text-tx group-hover:text-ac transition-colors">
                    {f.name}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-ac/10 text-ac font-medium">
                    {f.nodes}ノード
                  </span>
                </div>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {f.keywords.map(k => (
                    <span key={k} className="text-xs px-2 py-0.5 rounded bg-s2 text-muted">{k}</span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 出典 */}
      <div className="mt-10 p-4 bg-s1 rounded-xl border border-br">
        <p className="text-xs font-bold text-tx mb-2">出典・参考文献</p>
        <ul className="text-xs text-muted space-y-1">
          <li>• AHA Guidelines for CPR and Emergency Cardiovascular Care (2020 update)</li>
          <li>• JRC 蘇生ガイドライン 2020</li>
          <li>• ACLS Provider Manual (AHA)</li>
          <li>• BLS Provider Manual (AHA)</li>
        </ul>
      </div>
    </main>
  )
}
