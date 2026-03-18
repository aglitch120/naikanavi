import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ER・救急対応ツリー（主訴別 + ACLS/BLS）| iwor',
  description: '救急外来の主訴別に系統的アプローチ。胸痛・意識障害・腹痛・失神・発熱・呼吸困難・ショック・便秘など22主訴 + ACLS/BLS蘇生フロー。killer diseaseの見落としを防ぐ。',
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
  { href: '/tools/er/gi-bleeding', emoji: '🩸', name: '吐血・下血', desc: '上部/下部の判別 → ショック対応 → 静脈瘤/潰瘍/憩室の鑑別。GBSでリスク層別化' },
  { href: '/tools/er/palpitation', emoji: '💓', name: '動悸', desc: '12誘導心電図 → Narrow/Wide QRS → SVT/VT/AF鑑別。ACLS連動。非心原性も評価' },
  { href: '/tools/er/nausea-vomiting', emoji: '🤮', name: '悪心・嘔吐', desc: '急性腹症・頭蓋内圧亢進・ACS・DKAの除外 → 脱水評価 → 対症療法' },
  { href: '/tools/er/sore-throat', emoji: '😷', name: '咽頭痛', desc: '気道緊急除外 → 扁桃周囲膿瘍 → Centor基準でGAS鑑別 → EBV考慮' },
  { href: '/tools/er/hemoptysis', emoji: '🫁', name: '血痰・喀血', desc: '出血量評価 → 大量喀血は窒息リスク → BAE。肺癌・PE・結核の鑑別' },
  { href: '/tools/er/weakness', emoji: '💪', name: '麻痺・脱力', desc: 'UMN(脳卒中) vs LMN(GBS) vs 脊髄 vs 非神経学的。発症様式と分布で鑑別' },
  { href: '/tools/er/cough', emoji: '🤧', name: '咳・喀痰', desc: '急性/亜急性/慢性の分類 → 肺炎・PE・心不全の除外 → 3大慢性咳嗽原因の評価' },
  { href: '/tools/er/diarrhea', emoji: '🚽', name: '下痢', desc: '脱水評価 → 血便(EHEC/IBD/虚血性腸炎) → 感染性 → CDI評価 → 対症療法' },
  { href: '/tools/er/numbness', emoji: '🖐️', name: 'しびれ', desc: '脳卒中・脊髄・GBS除外 → 末梢神経障害(DM/B12) → 絞扼性神経障害 → 過換気' },
  { href: '/tools/er/hospital-fever', emoji: '🏥', name: '発熱（院内）', desc: '5D評価 + 術後W³I²F → FN/CRBSI/CAUTI/CDI/薬剤熱の系統的鑑別' },
  { href: '/tools/er/shock', emoji: '🔴', name: 'ショック（血圧低下）', desc: '4分類（出血性/心原性/閉塞性/分布異常性）の系統的鑑別。RUSH examベースの初期評価' },
  { href: '/tools/er/constipation', emoji: '💩', name: '便秘', desc: 'Red Flag評価 → 腸閉塞/穿孔/中毒性巨大結腸の除外 → 機能性/薬剤性便秘の段階的治療' },
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
      className="group p-4 bg-s0 border border-ac/15 rounded-xl hover:border-ac/30 hover:bg-acl transition-all">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-lg">{f.emoji}</span>
        <h2 className="text-sm font-bold text-tx group-hover:text-ac transition-colors">{f.name}</h2>
      </div>
      <p className="text-[11px] text-muted leading-relaxed line-clamp-2">{f.desc}</p>
    </Link>
  )
}

export default function ERPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
