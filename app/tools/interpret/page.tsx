import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '検査読影ツール',
  description: '血液ガス・心電図・胸部X線・腹部エコー・体液検査・心エコー・胸部CT・頭部CT・血液検査・尿検査・頸動脈エコーのインタラクティブ解釈フロー。',
}

const tools = [
  { href: '/tools/interpret/blood-gas', name: '血液ガス分析 インタラクティブ解釈', desc: 'pH・PCO₂・HCO₃⁻を入力 → 酸塩基障害を5ステップで自動解釈。AG・代償・A-aDO₂・P/F比まで一括評価。', badge: '', live: true },
  { href: '/tools/interpret/ecg', name: '心電図（ECG）系統的読影フロー', desc: '心拍数→リズム→P波→PR→QRS→軸→ST→T波→QTc の9ステップ解析。所見を入力→鑑別疾患を自動表示。', badge: '', live: true },
  { href: '/tools/interpret/chest-xray', name: '胸部X線 系統的読影チェックリスト', desc: 'ABCDE法（Airway・Bones・Cardiac・Diaphragm・Everything else）で見落としゼロの読影。', badge: '', live: true },
  { href: '/tools/interpret/abdominal-echo', name: '腹部エコー 系統的評価チェックリスト', desc: '肝・胆・膵・腎・脾・大動脈を臓器別に評価。所見チェック→鑑別疾患と次の精査を表示。', badge: '', live: true },
  { href: '/tools/interpret/body-fluid', name: '体液検査（胸水・腹水・髄液）', desc: 'Light基準・SAAG・髄液細胞数/蛋白/糖でステップバイステップ鑑別。SBP・髄膜炎の迅速評価。', badge: '', live: true },
  { href: '/tools/interpret/cardiac-echo', name: '心エコー 系統的評価チェックリスト', desc: '左室機能→右室→弁膜症→心膜の順に評価。LVEF・壁運動・弁膜症の重症度判定と次のアクション。', badge: 'NEW', live: true },
  { href: '/tools/interpret/ct-chest', name: '胸部CT 系統的評価チェックリスト', desc: '肺実質→胸膜→縦隔→骨・軟部の順に評価。結節・GGO・PE・大動脈解離の鑑別をサポート。', badge: 'NEW', live: true },
  { href: '/tools/interpret/ct-head', name: '頭部CT 系統的評価チェックリスト', desc: '脳実質→脳室→骨・軟部の順に評価。出血・梗塞・腫瘤の迅速な鑑別と重症度判定。', badge: 'NEW', live: true },
  { href: '/tools/interpret/blood-test', name: '血液検査 系統的解釈チェックリスト', desc: 'CBC→生化学→凝固系の順に異常値パターンを評価。鑑別疾患と次の検査・治療を提示。', badge: 'NEW', live: true },
  { href: '/tools/interpret/urinalysis', name: '尿検査 系統的解釈チェックリスト', desc: '試験紙→尿沈渣の順に評価。蛋白尿・血尿・膿尿のパターンから腎疾患・UTIを鑑別。', badge: 'NEW', live: true },
  { href: '/tools/interpret/carotid-echo', name: '頸動脈エコー 系統的評価チェックリスト', desc: 'IMT→プラーク性状→狭窄評価→椎骨動脈の順に評価。脳卒中リスクとCEA/CAS適応を判定。', badge: 'NEW', live: true },
  { href: '/tools/interpret/lab-values', name: '基準値早見表', desc: '年齢・性別を入力→CBC・凝固・肝腎・電解質・脂質・糖・甲状腺・心臓・腫瘍マーカーの基準値一覧。', badge: 'NEW', live: true },
]

export default function InterpretPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {tools.map(t => t.live ? (
          <Link key={t.href} href={t.href}
            className="group block p-4 bg-s0 border border-ac/15 rounded-xl hover:border-ac/30 hover:bg-acl transition-all">
            <h2 className="text-sm font-bold text-tx group-hover:text-ac transition-colors mb-1.5">{t.name}</h2>
            <p className="text-[11px] text-muted leading-relaxed line-clamp-2">{t.desc}</p>
          </Link>
        ) : (
          <div key={t.name} className="p-4 bg-s1/50 border border-br/50 rounded-xl opacity-50">
            <h2 className="text-sm font-bold text-muted mb-1.5">{t.name}</h2>
            <p className="text-[11px] text-muted/70 leading-relaxed line-clamp-2">{t.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
