'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

// ── スペクトラムデータ ──
type Coverage = 'good' | 'some' | 'none' | 'variable'
interface Drug {
  id: string; name: string; nameEn: string; category: string
  gpc: Coverage; gpcMrsa: Coverage; gnr: Coverage; gnrPseudomonas: Coverage; anaerobe: Coverage; atypical: Coverage
  note: string
}

const DRUGS: Drug[] = [
  // ペニシリン系
  { id:'abpc', name:'ABPC', nameEn:'アンピシリン', category:'ペニシリン系', gpc:'good', gpcMrsa:'none', gnr:'some', gnrPseudomonas:'none', anaerobe:'some', atypical:'none', note:'GPC+一部GNR。リステリア、腸球菌に有効' },
  { id:'abpc-sbt', name:'ABPC/SBT', nameEn:'アンピシリン/スルバクタム', category:'ペニシリン系', gpc:'good', gpcMrsa:'none', gnr:'good', gnrPseudomonas:'none', anaerobe:'good', atypical:'none', note:'嫌気性菌◎。腹腔内感染・誤嚥性肺炎に' },
  { id:'pipc-taz', name:'TAZ/PIPC', nameEn:'ピペラシリン/タゾバクタム', category:'ペニシリン系', gpc:'good', gpcMrsa:'none', gnr:'good', gnrPseudomonas:'good', anaerobe:'good', atypical:'none', note:'広域。緑膿菌◎。院内感染のエンピリック' },
  // セフェム系
  { id:'cez', name:'CEZ', nameEn:'セファゾリン', category:'セフェム第1世代', gpc:'good', gpcMrsa:'none', gnr:'some', gnrPseudomonas:'none', anaerobe:'none', atypical:'none', note:'MSSA第一選択。術前予防抗菌薬の標準' },
  { id:'ctr', name:'CTRX', nameEn:'セフトリアキソン', category:'セフェム第3世代', gpc:'good', gpcMrsa:'none', gnr:'good', gnrPseudomonas:'none', anaerobe:'none', atypical:'none', note:'1日1回投与可。市中感染の第一選択。髄液移行◎' },
  { id:'caz', name:'CAZ', nameEn:'セフタジジム', category:'セフェム第3世代', gpc:'some', gpcMrsa:'none', gnr:'good', gnrPseudomonas:'good', anaerobe:'none', atypical:'none', note:'緑膿菌◎だがGPC弱い。発熱性好中球減少症' },
  { id:'cfpm', name:'CFPM', nameEn:'セフェピム', category:'セフェム第4世代', gpc:'good', gpcMrsa:'none', gnr:'good', gnrPseudomonas:'good', anaerobe:'none', atypical:'none', note:'GPC+緑膿菌。FN第一選択の一つ' },
  // カルバペネム
  { id:'mepm', name:'MEPM', nameEn:'メロペネム', category:'カルバペネム', gpc:'good', gpcMrsa:'none', gnr:'good', gnrPseudomonas:'good', anaerobe:'good', atypical:'none', note:'最広域。重症感染のエスカレーション。ESBL産生菌にも有効' },
  { id:'ipm-cs', name:'IPM/CS', nameEn:'イミペネム/シラスタチン', category:'カルバペネム', gpc:'good', gpcMrsa:'none', gnr:'good', gnrPseudomonas:'good', anaerobe:'good', atypical:'none', note:'痙攣リスクあり（中枢神経感染には避ける）' },
  // アミノグリコシド
  { id:'gm', name:'GM', nameEn:'ゲンタマイシン', category:'アミノグリコシド', gpc:'none', gpcMrsa:'none', gnr:'good', gnrPseudomonas:'good', anaerobe:'none', atypical:'none', note:'GNR+緑膿菌。腎毒性・耳毒性。TDM必須' },
  // キノロン
  { id:'lvfx', name:'LVFX', nameEn:'レボフロキサシン', category:'キノロン', gpc:'good', gpcMrsa:'none', gnr:'good', gnrPseudomonas:'some', anaerobe:'none', atypical:'good', note:'呼吸器キノロン。肺炎球菌+非定型。結核マスクに注意' },
  { id:'cpfx', name:'CPFX', nameEn:'シプロフロキサシン', category:'キノロン', gpc:'some', gpcMrsa:'none', gnr:'good', gnrPseudomonas:'good', anaerobe:'none', atypical:'some', note:'緑膿菌◎。GPC弱い。尿路感染に' },
  // マクロライド
  { id:'azm', name:'AZM', nameEn:'アジスロマイシン', category:'マクロライド', gpc:'some', gpcMrsa:'none', gnr:'none', gnrPseudomonas:'none', anaerobe:'none', atypical:'good', note:'非定型肺炎（マイコプラズマ・クラミジア・レジオネラ）の第一選択' },
  { id:'cam', name:'CAM', nameEn:'クラリスロマイシン', category:'マクロライド', gpc:'some', gpcMrsa:'none', gnr:'none', gnrPseudomonas:'none', anaerobe:'none', atypical:'good', note:'非定型+MAC。H. pylori除菌' },
  // グリコペプチド
  { id:'vcm', name:'VCM', nameEn:'バンコマイシン', category:'グリコペプチド', gpc:'good', gpcMrsa:'good', gnr:'none', gnrPseudomonas:'none', anaerobe:'some', atypical:'none', note:'MRSA第一選択。TDM必須（AUC/MIC 400-600目標）。CDI内服にも' },
  // リネゾリド
  { id:'lzd', name:'LZD', nameEn:'リネゾリド', category:'オキサゾリジノン', gpc:'good', gpcMrsa:'good', gnr:'none', gnrPseudomonas:'none', anaerobe:'none', atypical:'none', note:'MRSA肺炎に有効（肺移行◎）。骨髄抑制・MAO阻害注意。14日以上は血球モニタリング' },
  // メトロニダゾール
  { id:'mnz', name:'MNZ', nameEn:'メトロニダゾール', category:'ニトロイミダゾール', gpc:'none', gpcMrsa:'none', gnr:'none', gnrPseudomonas:'none', anaerobe:'good', atypical:'none', note:'嫌気性菌◎。脳膿瘍（BBB通過◎）。飲酒禁忌（ジスルフィラム様反応）' },
  // 抗真菌
  { id:'mcfg', name:'MCFG', nameEn:'ミカファンギン', category:'キャンディン系', gpc:'none', gpcMrsa:'none', gnr:'none', gnrPseudomonas:'none', anaerobe:'none', atypical:'none', note:'Candida第一選択。Aspergillus△。ムコール×' },
]

const ORGANISMS = [
  { key: 'gpc', label: 'GPC\n(MSSA等)', short: 'GPC' },
  { key: 'gpcMrsa', label: 'MRSA', short: 'MRSA' },
  { key: 'gnr', label: 'GNR\n(大腸菌等)', short: 'GNR' },
  { key: 'gnrPseudomonas', label: '緑膿菌', short: 'PA' },
  { key: 'anaerobe', label: '嫌気性菌', short: '嫌気' },
  { key: 'atypical', label: '非定型\n(マイコ等)', short: '非定型' },
] as const

const coverageColor: Record<Coverage, string> = {
  good: 'bg-[#166534] text-white',
  some: 'bg-[#FEF3C7] text-[#92400E]',
  variable: 'bg-[#E8F0FE] text-[#1565C0]',
  none: 'bg-s2 text-muted',
}
const coverageLabel: Record<Coverage, string> = { good: '◎', some: '△', variable: '〜', none: '×' }

// ── エンピリック治療 ──
interface EmpRegimen { site: string; icon: string; conditions: { label: string; firstLine: string; alt: string; notes: string }[] }

const EMPIRIC: EmpRegimen[] = [
  { site: '肺炎（市中）', icon: '🫁', conditions: [
    { label: '軽症外来', firstLine: 'AMPC 1500mg/日 分3 × 5-7日', alt: 'AZM 500mg 初日 → 250mg × 4日 / LVFX 500mg/日', notes: 'Centor基準で定型/非定型を推定。CURB-65 0-1' },
    { label: '中等症入院', firstLine: 'CTRX 2g/日 + AZM 500mg/日', alt: 'LVFX 500mg/日 単剤', notes: 'レジオネラ尿中抗原も提出。CURB-65 2' },
    { label: '重症ICU', firstLine: 'CTRX 2g/日 + AZM 500mg/日', alt: '緑膿菌リスク → TAZ/PIPC + LVFX', notes: 'CURB-65 3-5。血培2セット必須' },
  ]},
  { site: '尿路感染', icon: '🚿', conditions: [
    { label: '単純性膀胱炎', firstLine: 'LVFX 500mg × 3日 or ST合剤 × 3日', alt: 'セファレキシン 1500mg/日 × 7日', notes: '女性の再発性 → 予防投与検討' },
    { label: '腎盂腎炎（軽症外来）', firstLine: 'LVFX 500mg/日 × 7-14日', alt: 'CTRX 1g/日 im/iv × 1回 → 経口LVFX', notes: '尿培養必須。48hで改善なければCT（膿瘍・閉塞除外）' },
    { label: '腎盂腎炎（重症入院）', firstLine: 'CTRX 2g/日 iv', alt: '緑膿菌リスク → CFPM or TAZ/PIPC', notes: '血培2セット。ESBL疑い → MEPM' },
  ]},
  { site: '腹腔内感染', icon: '🩺', conditions: [
    { label: '市中（虫垂炎/憩室炎等）', firstLine: 'ABPC/SBT 3g q6h', alt: 'CTRX 2g/日 + MNZ 500mg q8h', notes: '嫌気性菌カバー必須。外科コンサルト' },
    { label: '院内/術後', firstLine: 'TAZ/PIPC 4.5g q6h or MEPM 1g q8h', alt: '+VCM（MRSA腸炎リスク時）', notes: '真菌（カンジダ）のカバーも検討' },
  ]},
  { site: '皮膚軟部組織', icon: '🩹', conditions: [
    { label: '蜂窩織炎（非壊死性）', firstLine: 'CEZ 2g q8h iv / セファレキシン 1500mg/日 po', alt: 'CLDM 600mg q8h（ペニシリンアレルギー）', notes: 'GAS/MSSA が主原因。壊死性筋膜炎の除外が最重要' },
    { label: 'MRSA皮膚感染', firstLine: 'ST合剤 or DOXY or CLDM（外来）', alt: 'VCM iv（重症）', notes: '膿瘍 → 切開排膿が第一。抗菌薬単独では不十分なことが多い' },
    { label: '壊死性筋膜炎', firstLine: 'MEPM + VCM + CLDM', alt: '外科的デブリドマンが必須（抗菌薬だけでは救命できない）', notes: '緊急手術。LRINEC score ≧ 6で疑い。Pain out of proportion' },
  ]},
  { site: '髄膜炎', icon: '🧠', conditions: [
    { label: '市中細菌性（成人）', firstLine: 'CTRX 2g q12h + VCM 15-20mg/kg q8-12h', alt: '+ ABPC 2g q4h（≧50歳 or 免疫不全 → リステリアカバー）', notes: 'デキサメタゾン 0.15mg/kg q6h × 4日（初回抗菌薬投与前 or 同時）' },
    { label: '院内/術後', firstLine: 'MEPM 2g q8h + VCM', alt: '', notes: '脳室ドレーン関連 → 黄色ブドウ球菌・GNR' },
  ]},
  { site: '敗血症（感染巣不明）', icon: '🦠', conditions: [
    { label: '市中発症', firstLine: 'TAZ/PIPC 4.5g q6h or MEPM 1g q8h', alt: '+VCM（MRSA リスク時）', notes: 'Hour-1 Bundle。血培2セット→抗菌薬1h以内。感染巣検索並行' },
    { label: '院内発症/ICU', firstLine: 'MEPM 1g q8h + VCM', alt: '+MCFG（真菌リスク時）', notes: 'de-escalation原則。培養結果で絞る' },
  ]},
  { site: '発熱性好中球減少症(FN)', icon: '🚨', conditions: [
    { label: '高リスク', firstLine: 'CFPM 2g q8h or TAZ/PIPC 4.5g q6h or MEPM 1g q8h', alt: '+VCM（カテーテル感染/MRSA疑い時）', notes: '30分以内に投与開始。4-7日改善なし→抗真菌薬追加' },
    { label: '低リスク(MASCC≧21)', firstLine: 'LVFX 500mg + AMPC/CVA 内服', alt: '外来管理の検討も', notes: 'daily follow-up必須' },
  ]},
]

type TabId = 'spectrum' | 'empiric'

export default function AntibioticsPage() {
  const [tab, setTab] = useState<TabId>('spectrum')
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const [expandedSite, setExpandedSite] = useState<string | null>(EMPIRIC[0].site)

  const categories = useMemo(() => {
    const cats = Array.from(new Set(DRUGS.map(d => d.category)))
    return ['all', ...cats]
  }, [])

  const filteredDrugs = useMemo(() => {
    if (selectedCat === 'all') return DRUGS
    return DRUGS.filter(d => d.category === selectedCat)
  }, [selectedCat])

  return (
    <div className="max-w-5xl mx-auto">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span>
        <Link href="/tools/drugs" className="hover:text-ac">薬剤ガイド</Link><span className="mx-2">›</span>
        <span>抗菌薬スペクトラム</span>
      </nav>

      <header className="mb-6">
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">💊 抗菌薬</span>
        <h1 className="text-2xl font-bold text-tx mb-1">抗菌薬ガイド</h1>
        <p className="text-sm text-muted">スペクトラム一覧 + 感染症別エンピリック選択。腎機能別用量は<Link href="/tools/calc/renal-dose-abx" className="text-ac hover:underline ml-1">腎機能別用量調整ツール</Link>を参照。</p>
      </header>

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-3 mb-6 text-sm text-wn">
        ⚠️ 抗菌薬の選択・用量は施設のアンチバイオグラム・患者の状態に基づき担当医が決定してください。本ガイドは一般的な推奨であり、施設プロトコルを優先してください。
      </div>

      {/* タブ */}
      <div className="flex border border-br rounded-xl overflow-hidden mb-6">
        <button onClick={() => setTab('spectrum')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'spectrum' ? 'bg-ac text-white' : 'bg-s1 text-muted hover:text-tx'}`}>
          📊 スペクトラム
        </button>
        <button onClick={() => setTab('empiric')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'empiric' ? 'bg-ac text-white' : 'bg-s1 text-muted hover:text-tx'}`}>
          🎯 エンピリック選択
        </button>
      </div>

      {/* ── スペクトラムタブ ── */}
      {tab === 'spectrum' && (
        <div>
          {/* カテゴリフィルタ */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
            {categories.map(c => (
              <button key={c} onClick={() => setSelectedCat(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all ${
                  selectedCat === c ? 'border-ac bg-acl text-ac' : 'border-br bg-s0 text-muted hover:text-tx'
                }`}>
                {c === 'all' ? '全て' : c}
              </button>
            ))}
          </div>

          {/* 凡例 */}
          <div className="flex gap-3 mb-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-5 h-5 rounded bg-[#166534] text-white flex items-center justify-center text-[10px] font-bold">◎</span>有効</span>
            <span className="flex items-center gap-1"><span className="w-5 h-5 rounded bg-[#FEF3C7] text-[#92400E] flex items-center justify-center text-[10px] font-bold">△</span>一部</span>
            <span className="flex items-center gap-1"><span className="w-5 h-5 rounded bg-s2 text-muted flex items-center justify-center text-[10px] font-bold">×</span>無効</span>
          </div>

          {/* スペクトラム表 */}
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-s1">
                  <th className="text-left p-2 font-bold text-tx border-b border-br sticky left-0 bg-s1 z-10 min-w-[120px]">薬剤</th>
                  {ORGANISMS.map(o => (
                    <th key={o.key} className="p-2 font-bold text-tx border-b border-br text-center whitespace-pre-line w-16">{o.short}</th>
                  ))}
                  <th className="text-left p-2 font-bold text-tx border-b border-br min-w-[200px]">メモ</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrugs.map((d, i) => (
                  <tr key={d.id} className={i % 2 === 0 ? 'bg-s0' : 'bg-bg'}>
                    <td className="p-2 font-bold text-tx border-b border-br sticky left-0 z-10" style={{ background: i % 2 === 0 ? 'var(--s0, #FEFEFC)' : 'var(--bg, #F5F4F0)' }}>
                      {d.name}
                      <span className="block text-[10px] font-normal text-muted">{d.nameEn}</span>
                    </td>
                    {ORGANISMS.map(o => {
                      const cov = d[o.key as keyof Drug] as Coverage
                      return (
                        <td key={o.key} className="p-1 border-b border-br text-center">
                          <span className={`inline-flex w-7 h-7 items-center justify-center rounded font-bold text-[11px] ${coverageColor[cov]}`}>
                            {coverageLabel[cov]}
                          </span>
                        </td>
                      )
                    })}
                    <td className="p-2 text-muted border-b border-br">{d.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── エンピリックタブ ── */}
      {tab === 'empiric' && (
        <div className="space-y-3">
          {EMPIRIC.map(e => (
            <div key={e.site} className="bg-s0 border border-br rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedSite(expandedSite === e.site ? null : e.site)}
                className="w-full flex items-center justify-between p-4 hover:bg-s1/50 transition-colors"
              >
                <span className="text-sm font-bold text-tx flex items-center gap-2">
                  <span>{e.icon}</span> {e.site}
                </span>
                <span className={`text-muted transition-transform ${expandedSite === e.site ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {expandedSite === e.site && (
                <div className="px-4 pb-4 space-y-3">
                  {e.conditions.map((c, i) => (
                    <div key={i} className="bg-acl/50 border border-ac/10 rounded-lg p-3">
                      <p className="text-xs font-bold text-ac mb-2">{c.label}</p>
                      <div className="space-y-1.5 text-xs">
                        <p className="text-tx"><span className="font-bold text-[#166534]">第一選択:</span> {c.firstLine}</p>
                        {c.alt && <p className="text-tx"><span className="font-bold text-[#92400E]">代替:</span> {c.alt}</p>}
                        <p className="text-muted">{c.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 関連ツール */}
      <section className="mt-8 mb-8">
        <h2 className="text-lg font-bold mb-3">関連ツール</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/tools/calc/renal-dose-abx', name: '腎機能別用量調整' },
            { href: '/tools/calc/egfr', name: 'eGFR' },
            { href: '/tools/calc/cockcroft-gault', name: 'CCr (Cockcroft-Gault)' },
            { href: '/tools/calc/curb-65', name: 'CURB-65' },
          ].map(t => (
            <Link key={t.href} href={t.href}
              className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">
              {t.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 出典 */}
      <section className="mb-8">
        <div className="bg-s1 rounded-xl border border-br p-4">
          <p className="text-xs font-bold text-tx mb-2">参考</p>
          <ul className="text-xs text-muted space-y-1">
            <li>• 日本化学療法学会/日本感染症学会. JAID/JSC感染症治療ガイド 2023</li>
            <li>• Mandell, Douglas, and Bennett's Principles and Practice of Infectious Diseases, 9th ed</li>
            <li>• The Sanford Guide to Antimicrobial Therapy 2024</li>
            <li>• 各薬剤の添付文書（PMDA）</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
