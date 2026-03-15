import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ER主訴別対応ツリー | iwor',
  description: '救急外来の主訴別に系統的アプローチ。胸痛・意識障害・腹痛・失神・発熱・呼吸困難のクリック式対応フローで、killer diseaseの見落としを防ぐ。',
}

const flows = [
  { href: '/tools/er/chest-pain', emoji: '💓', name: '胸痛', desc: 'Killer chest pain 5疾患（ACS・PE・大動脈解離・緊張性気胸・心タンポナーデ）の系統的除外フロー', badge: 'NEW', live: true },
  { href: '/tools/er/altered-consciousness', emoji: '🧠', name: '意識障害', desc: 'AIUEOTIPS + バイタル安定化 → 緊急CT/採血 → 原因検索のステップフロー', badge: 'NEW', live: true },
  { href: '/tools/er/abdominal-pain', emoji: '🩺', name: '腹痛', desc: '部位別鑑別 + 緊急手術適応判断 + 女性特有疾患の見落とし防止フロー', badge: 'NEW', live: true },
  { href: '/tools/er/syncope', emoji: '😵', name: '失神', desc: '心原性 vs 非心原性の鑑別。一過性意識消失確認 → バイタル → 心電図 → 病歴 → SFSR層別化', badge: 'NEW', live: true },
  { href: '/tools/er/fever', emoji: '🌡️', name: '発熱', desc: '敗血症スクリーニング（qSOFA）→ 免疫状態評価 → 感染巣推定。FN・Hour-1 Bundle対応', badge: 'NEW', live: true },
  { href: '/tools/er/dyspnea', emoji: '😤', name: '呼吸困難', desc: '気道緊急 → 呼吸不全原因検索 → 発症様式別鑑別。PE・心不全・喘息/COPD・ARDS・アナフィラキシー', badge: 'NEW', live: true },
]

export default function ERPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link>
        <span className="mx-2">›</span>
        <span>ER主訴別対応</span>
      </nav>

      <header className="mb-8">
        <span className="inline-block text-sm bg-dnl text-dn px-2.5 py-0.5 rounded-full font-medium mb-2">🚨 ER対応</span>
        <h1 className="text-2xl font-bold text-tx mb-2">ER主訴別 対応ツリー</h1>
        <p className="text-muted text-sm">
          主訴をクリック → ステップバイステップで系統的にアプローチ。Killer diseaseの見落としを防ぐインタラクティブフロー。
        </p>
      </header>

      <div className="grid gap-3">
        {flows.map(f => f.live ? (
          <Link key={f.href} href={f.href}
            className="group flex items-start gap-4 p-5 bg-s0 border border-br rounded-xl hover:border-ac/30 hover:bg-acl/30 transition-colors">
            <span className="text-2xl mt-0.5">{f.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-tx group-hover:text-ac transition-colors">{f.name}</h2>
                {f.badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-ac/10 text-ac font-bold">{f.badge}</span>}
              </div>
              <p className="text-sm text-muted">{f.desc}</p>
            </div>
            <span className="text-muted group-hover:text-ac transition-colors mt-1">→</span>
          </Link>
        ) : (
          <div key={f.name} className="flex items-start gap-4 p-5 bg-s1/50 border border-br/50 rounded-xl opacity-50">
            <span className="text-2xl mt-0.5">{f.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-muted">{f.name}</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-s2 text-muted font-bold">{f.badge}</span>
              </div>
              <p className="text-sm text-muted/70">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SEO解説 */}
      <section className="mt-12 space-y-4 text-sm text-muted">
        <h2 className="text-base font-bold text-tx">ER主訴別アプローチとは</h2>
        <p>
          救急外来では「まず致死的疾患を除外する」ことが最優先です。
          本ツールは主訴別のkiller diseaseを系統的に除外するための対応フローを提供します。
          ABCDEアプローチによる安定化を前提に、見落としやすいピットフォールをステップごとにチェックできます。
        </p>
        <p>
          各フローはエビデンスに基づくスコアリング（HEART score、Wells criteria、SFSR等）と連動し、
          既存の計算ツールへのリンクも含まれています。当直中のセカンドオピニオンとしてご活用ください。
        </p>
      </section>
    </main>
  )
}
