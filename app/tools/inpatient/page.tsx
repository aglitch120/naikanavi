import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '入院中トラブル対応 | iwor',
  description: '入院患者の急変・トラブルに対する初期対応フロー。ショック、SpO2低下、頻脈徐脈、せん妄、転倒、血糖異常、アナフィラキシー、アルコール離脱など10項目。',
}

const items = [
  { href: '/tools/inpatient/shock', emoji: '🔴', name: 'ショック（血圧低下）', desc: '4分類（出血性/心原性/閉塞性/分布異常性）→ 初期輸液 → 昇圧剤選択 → 原因検索' },
  { href: '/tools/inpatient/desaturation', emoji: '🫁', name: 'SpO2低下', desc: '気道開通確認 → 酸素投与 → 肺塞栓/気胸/心不全/誤嚥/無気肺の鑑別' },
  { href: '/tools/inpatient/tachy-brady', emoji: '💓', name: '頻脈・徐脈', desc: '血行動態評価 → 頻脈: Narrow/Wide QRS鑑別 → 徐脈: アトロピン/ペーシング' },
  { href: '/tools/inpatient/consciousness', emoji: '🧠', name: '意識障害', desc: 'GCS評価 → バイタル安定化 → 低血糖/脳卒中/薬剤性/てんかん後の鑑別' },
  { href: '/tools/inpatient/self-removal', emoji: '⚠️', name: '自己抜去', desc: '点滴・胃管・胃瘻・尿道カテ・ドレーン別の初期対応と再挿入判断フロー' },
  { href: '/tools/inpatient/delirium', emoji: '😵‍💫', name: 'せん妄', desc: '過活動型/低活動型の鑑別 → 原因検索（感染/薬剤/電解質/便秘尿閉）→ 非薬物/薬物対応' },
  { href: '/tools/inpatient/fall', emoji: '🩹', name: '転倒', desc: '外傷評価 → 頭部打撲時のCT適応 → 抗凝固中の対応 → 骨折チェック → 転倒予防' },
  { href: '/tools/inpatient/glycemic', emoji: '🩸', name: '血糖異常', desc: '低血糖: ブドウ糖投与 → 原因検索。高血糖: DKA/HHS鑑別 → 補液+インスリン' },
  { href: '/tools/inpatient/anaphylaxis', emoji: '🚨', name: 'アナフィラキシー', desc: 'アドレナリン筋注（大腿外側）→ 輸液 → 気道確保 → 二相性反応の経過観察' },
  { href: '/tools/inpatient/withdrawal-insomnia', emoji: '🌙', name: 'アルコール離脱・不眠', desc: 'CIWA-Ar評価 → ベンゾジアゼピン → Wernicke予防。不眠: 非薬物→薬物対応' },
]

function Card({ f }: { f: typeof items[0] }) {
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

export default function InpatientPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link>
        <span className="mx-2">›</span>
        <span>入院中トラブル対応</span>
      </nav>
      <h1 className="text-2xl font-bold text-tx mb-2">入院中トラブル対応</h1>
      <p className="text-sm text-muted mb-8">入院患者の急変・トラブルに対する系統的アプローチ。ステップに沿って初期評価→原因検索→対応を進められます。</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map(f => <Card key={f.href} f={f} />)}
      </div>
    </main>
  )
}
