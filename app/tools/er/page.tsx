import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ER・救急対応ツリー（主訴別 + ACLS/BLS）| iwor',
  description: '救急外来の主訴別に系統的アプローチ。胸痛・意識障害・腹痛・失神・発熱・呼吸困難 + ACLS/BLS蘇生フロー。killer diseaseの見落としを防ぐ。',
}

const erFlows = [
  { href: '/tools/er/chest-pain', emoji: '💓', name: '胸痛', desc: 'Killer chest pain 5疾患（ACS・PE・大動脈解離・緊張性気胸・心タンポナーデ）の系統的除外フロー' },
  { href: '/tools/er/altered-consciousness', emoji: '🧠', name: '意識障害', desc: 'AIUEOTIPS + バイタル安定化 → 緊急CT/採血 → 原因検索のステップフロー' },
  { href: '/tools/er/abdominal-pain', emoji: '🩺', name: '腹痛', desc: '部位別鑑別 + 緊急手術適応判断 + 女性特有疾患の見落とし防止フロー' },
  { href: '/tools/er/syncope', emoji: '😵', name: '失神', desc: '心原性 vs 非心原性の鑑別。一過性意識消失確認 → バイタル → 心電図 → 病歴 → SFSR層別化' },
  { href: '/tools/er/fever', emoji: '🌡️', name: '発熱', desc: '敗血症スクリーニング（qSOFA）→ 免疫状態評価 → 感染巣推定。FN・Hour-1 Bundle対応' },
  { href: '/tools/er/dyspnea', emoji: '😤', name: '呼吸困難', desc: '気道緊急 → 呼吸不全原因検索 → 発症様式別鑑別。PE・心不全・喘息/COPD・ARDS・アナフィラキシー' },
  { href: '/tools/er/seizure', emoji: '⚡', name: 'けいれん', desc: 'てんかん重積SE → 段階的薬物治療。初発/既知/誘発性の鑑別。子癇・低Na・アルコール離脱対応' },
  { href: '/tools/er/dizziness', emoji: '🌀', name: 'めまい', desc: '回転性/浮動性/失調の分類 → HINTSで中枢性除外 → BPPV/前庭神経炎/脳卒中の鑑別' },
  { href: '/tools/er/headache', emoji: '🤕', name: '頭痛', desc: 'Red Flag評価 → SAH/髄膜炎/GCA除外 → 片頭痛/緊張型/群発の急性期治療' },
  { href: '/tools/er/back-pain', emoji: '🦴', name: '腰背部痛', desc: 'AAA破裂・馬尾症候群・脊椎感染症・尿管結石の除外 → 非特異的腰痛の管理' },
]

const aclsFlows = [
  { href: '/tools/acls/bls', emoji: '🫀', name: '成人BLS', desc: '反応確認 → 119番通報 → CPR → AED。院外心停止の初動対応。' },
  { href: '/tools/acls/cardiac-arrest', emoji: '⚡', name: '心停止アルゴリズム', desc: 'VF/pVT vs Asystole/PEA。除細動・アドレナリン・アミオダロン・5H/5T・ROSC後管理。' },
  { href: '/tools/acls/tachycardia', emoji: '📈', name: '頻脈アルゴリズム', desc: '安定/不安定 → Narrow/Wide QRS → 系統的鑑別。SVT・AF・VT・WPW+AF対応。' },
  { href: '/tools/acls/bradycardia', emoji: '📉', name: '徐脈アルゴリズム', desc: 'アトロピン → 経皮ペーシング → 経静脈ペーシング。房室ブロック種類別に判断。' },
]

function FlowCard({ f }: { f: typeof erFlows[0] }) {
  return (
    <Link href={f.href}
      className="group flex items-start gap-4 p-5 bg-s0 border border-ac/15 rounded-xl hover:border-ac/30 hover:bg-acl transition-all">
      <div className="w-10 h-10 bg-ac/10 border border-ac/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-xl">{f.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-bold text-tx group-hover:text-ac transition-colors mb-0.5">{f.name}</h2>
        <p className="text-sm text-muted">{f.desc}</p>
      </div>
      <span className="text-muted group-hover:text-ac transition-colors mt-1">→</span>
    </Link>
  )
}

export default function ERPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link>
        <span className="mx-2">›</span>
        <span>ER・救急対応</span>
      </nav>

      <header className="mb-8">
        <span className="inline-block text-sm bg-dnl text-dn px-2.5 py-0.5 rounded-full font-medium mb-2">🚨 ER対応</span>
        <h1 className="text-2xl font-bold text-tx mb-2">ER・救急対応ツリー</h1>
        <p className="text-muted text-sm">
          主訴別の系統的アプローチ + ACLS/BLS蘇生フロー。Killer diseaseの見落としを防ぐインタラクティブツール。
        </p>
      </header>

      {/* ── 主訴別ER対応 ── */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">主訴別ER対応</h2>
        <div className="grid gap-3">
          {erFlows.map(f => <FlowCard key={f.href} f={f} />)}
        </div>
      </section>

      {/* ── ACLS / BLS ── */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">ACLS / BLS（蘇生アルゴリズム）</h2>
        <div className="bg-dnl border-2 border-dnb rounded-xl p-3 mb-3">
          <p className="text-xs text-dn">
            ⚠️ AHA / JRCガイドライン準拠。実際の蘇生場面では施設のプロトコル・チームリーダーの指示に従ってください。
          </p>
        </div>
        <div className="grid gap-3">
          {aclsFlows.map(f => <FlowCard key={f.href} f={f} />)}
        </div>
      </section>

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
