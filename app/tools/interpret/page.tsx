import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '検査読影ツール',
  description: '血液ガス・心電図・胸部X線・腹部エコー・体液検査のインタラクティブ解釈フロー。ステップバイステップで系統的に評価。',
}

const tools = [
  { href: '/tools/interpret/blood-gas', name: '血液ガス分析 インタラクティブ解釈', desc: 'pH・PCO₂・HCO₃⁻を入力 → 酸塩基障害を5ステップで自動解釈。AG・代償・A-aDO₂・P/F比まで一括評価。', badge: 'NEW', live: true },
  { href: '/tools/interpret/ecg', name: '心電図（ECG）系統的読影フロー', desc: '心拍数→リズム→P波→PR→QRS→軸→ST→T波→QTc の9ステップ解析。所見を入力→鑑別疾患を自動表示。', badge: 'NEW', live: true },
  { href: '/tools/interpret/chest-xray', name: '胸部X線 系統的読影チェックリスト', desc: 'ABCDE法（Airway・Bones・Cardiac・Diaphragm・Everything else）で見落としゼロの読影。', badge: 'NEW', live: true },
  { href: '/tools/interpret/abdominal-echo', name: '腹部エコー 系統的評価チェックリスト', desc: '肝・胆・膵・腎・脾・大動脈を臓器別に評価。所見チェック→鑑別疾患と次の精査を表示。', badge: 'NEW', live: true },
  { href: '/tools/interpret/body-fluid', name: '体液検査（胸水・腹水・髄液）', desc: 'Light基準・SAAG・髄液細胞数/蛋白/糖でステップバイステップ鑑別。SBP・髄膜炎の迅速評価。', badge: 'NEW', live: true },
]

export default function InterpretPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link>
        <span className="mx-2">›</span>
        <span>検査読影</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-tx mb-2">検査読影ツール</h1>
        <p className="text-muted text-sm">検査データを入力 → ステップバイステップで解釈。見落としを防ぐインタラクティブフロー。</p>
      </header>

      <div className="grid gap-3">
        {tools.map(t => t.live ? (
          <Link key={t.href} href={t.href}
            className="group block p-4 bg-s0 border border-ac/15 rounded-xl hover:border-ac/30 hover:bg-acl transition-all">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-tx group-hover:text-ac transition-colors">{t.name}</h2>
              {t.badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-ac/10 text-ac font-bold">{t.badge}</span>}
            </div>
            <p className="text-sm text-muted">{t.desc}</p>
          </Link>
        ) : (
          <div key={t.name} className="p-4 bg-s1/50 border border-br/50 rounded-xl opacity-50">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-muted">{t.name}</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-s2 text-muted font-bold">{t.badge}</span>
            </div>
            <p className="text-sm text-muted/70">{t.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
