'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import ProGate from '@/components/pro/ProGate'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'
import { trackToolUsage } from '@/components/pro/useProStatus'

type Sev = 'ok' | 'wn' | 'dn' | 'neutral'

const categories = [
  {
    key: 'CBC', title: '血算（CBC）',
    desc: 'WBC・RBC/Hb・Plt・分画',
    findings: [
      { id: 'cbc_normal', label: 'CBC 正常', detail: 'WBC 4,000-9,000, Hb 男13-17/女12-16 g/dL, Plt 15-35万。正常範囲。', severity: 'ok' as Sev },
      { id: 'wbc_high', label: 'WBC上昇（> 10,000）', detail: '白血球増多: 感染症（細菌性）・炎症・ストレス反応・ステロイド投与・CML・真性多血症を鑑別。左方移動（桿状核好中球↑）は細菌感染示唆。', severity: 'wn' as Sev },
      { id: 'wbc_low', label: 'WBC低下（< 4,000）', detail: '白血球減少: ウイルス感染・薬剤性（抗がん剤・抗甲状腺薬）・SLE・再生不良性貧血・MDS・骨髄浸潤を鑑別。好中球 < 500で発熱性好中球減少症(FN)リスク。', severity: 'wn' as Sev },
      { id: 'anemia', label: '貧血（Hb < 12 女 / < 13 男）', detail: 'MCV分類: 小球性（IDA・サラセミア・ACD）、正球性（出血・溶血・ACD・腎性）、大球性（VitB12/葉酸欠乏・MDS・肝疾患・甲状腺機能低下）。網赤血球で産生/破壊を鑑別。', severity: 'wn' as Sev },
      { id: 'polycythemia', label: '多血症（Hb > 18 男 / > 16 女）', detail: '赤血球増加: 真性多血症（PV、JAK2変異）vs 二次性（低酸素・腫瘍・EPO産生腫瘍）vs 相対的（脱水）。', severity: 'wn' as Sev },
      { id: 'plt_low', label: '血小板減少（< 15万）', detail: 'Plt減少: 偽性（EDTA凝集）を除外→ITP・TTP/HUS・DIC・薬剤性（HIT）・肝硬変・骨髄不全・SLE。< 5万で出血リスク上昇。< 1万で致死的出血リスク。', severity: 'wn' as Sev },
      { id: 'plt_high', label: '血小板増多（> 40万）', detail: 'Plt増多: 反応性（感染・炎症・鉄欠乏・脾摘後）vs 本態性血小板血症（JAK2/CALR変異）。> 100万で出血/血栓リスク。', severity: 'wn' as Sev },
      { id: 'pancytopenia', label: '汎血球減少', detail: 'WBC+Hb+Plt全て低下: 再生不良性貧血・MDS・白血病・SLE・巨赤芽球性貧血・脾機能亢進・薬剤性。骨髄検査が必要。', severity: 'dn' as Sev },
      { id: 'blast', label: '末梢血に芽球出現', detail: '芽球（blast）: 急性白血病を強く示唆。緊急骨髄検査+血液内科コンサルト。腫瘍崩壊症候群・DICの合併に注意。', severity: 'dn' as Sev },
    ]
  },
  {
    key: 'Biochem', title: '生化学',
    desc: '肝機能・腎機能・電解質・血糖',
    findings: [
      { id: 'biochem_normal', label: '生化学 正常', detail: '肝機能・腎機能・電解質いずれも基準範囲内。', severity: 'ok' as Sev },
      { id: 'ast_alt_high', label: 'AST/ALT上昇', detail: '肝逸脱酵素上昇。パターン分類: AST優位→アルコール性/心筋梗塞/溶血、ALT優位→ウイルス性/薬剤性/NAFLD。> 1000はウイルス性・薬剤性・虚血性肝炎。', severity: 'wn' as Sev },
      { id: 'alp_ggt_high', label: 'ALP/γGTP上昇', detail: '胆道系酵素上昇: 胆汁うっ滞パターン。胆石・胆管癌・薬剤性・PBC/PSCを鑑別。γGTP単独上昇はアルコール・薬剤性も。', severity: 'wn' as Sev },
      { id: 'tbil_high', label: 'T-Bil上昇（黄疸）', detail: '直接型優位→閉塞性/肝細胞性黄疸。間接型優位→溶血・Gilbert症候群。T-Bil > 2で黄疸出現。T-Bil > 10で重症。', severity: 'wn' as Sev },
      { id: 'bun_cr_high', label: 'BUN/Cr上昇（腎機能障害）', detail: 'BUN/Cr比 > 20: 腎前性。比正常: 腎性。eGFRでCKDステージ分類。急性腎障害（AKI）はKDIGO基準（48h以内のCr上昇）で診断。', severity: 'wn' as Sev },
      { id: 'na_low', label: '低Na血症（< 135）', detail: '体液量評価が鍵。低張性: 脱水型（嘔吐・下痢）・正常型（SIADH・甲状腺機能低下）・過剰型（心不全・肝硬変・腎不全）。急性 < 120は痙攣リスク→3%NaCl。', severity: 'wn' as Sev },
      { id: 'k_high', label: '高K血症（> 5.5）', detail: '高K: 腎不全・薬剤性（ACEI/ARB/K保持性利尿薬）・代謝性アシドーシス・横紋筋融解・溶血（偽性除外）。> 6.5 or ECG変化でGI+インスリン+Ca gluconate。', severity: 'dn' as Sev },
      { id: 'k_low', label: '低K血症（< 3.5）', detail: '低K: 嘔吐・下痢・利尿薬・原発性アルドステロン症・Cushing・尿細管性アシドーシス・下剤乱用。< 3.0で不整脈リスク。Mg補充も重要。', severity: 'wn' as Sev },
      { id: 'glucose_high', label: '高血糖（> 200）', detail: '糖尿病・ストレス性高血糖。> 300でDKA/HHS鑑別。DKA: AG開大性アシドーシス+ケトン体。HHS: 著明な高浸透圧+脱水。', severity: 'wn' as Sev },
      { id: 'crp_high', label: 'CRP上昇', detail: '非特異的炎症マーカー。> 10: 細菌感染・自己免疫疾患。> 20: 重症細菌感染が多い。プロカルシトニン（PCT）と併用で細菌感染をより特異的に評価。', severity: 'wn' as Sev },
    ]
  },
  {
    key: 'Coag', title: '凝固系',
    desc: 'PT/APTT/D-dimer/FDP',
    findings: [
      { id: 'coag_normal', label: '凝固系 正常', detail: 'PT-INR・APTT・D-dimer基準範囲内。', severity: 'ok' as Sev },
      { id: 'pt_prolonged', label: 'PT延長（INR上昇）', detail: 'PT延長: ワーファリン効果・VitK欠乏・肝不全・DIC（消費性）。外因系（VII→X→V→II→フィブリノゲン）の障害。', severity: 'wn' as Sev },
      { id: 'aptt_prolonged', label: 'APTT延長', detail: 'APTT延長: ヘパリン効果・血友病（VIII/IX欠乏）・ループスアンチコアグラント・DIC。PT正常+APTT延長→内因系の異常。', severity: 'wn' as Sev },
      { id: 'ddimer_high', label: 'D-dimer上昇', detail: 'D-dimer: 感度高いが特異度低い。PE/DVTの除外に有用（陰性的中率高い）。DIC・術後・悪性腫瘍・感染症でも上昇。', severity: 'wn' as Sev },
      { id: 'dic', label: 'DIC所見（Plt↓ FDP/D-dimer↑ PT↑ Fib↓）', detail: 'DIC: 基礎疾患の治療が最重要。敗血症・悪性腫瘍・産科合併症が三大原因。ISTH スコアで診断。出血型→FFP/PC。線溶亢進型→トラネキサム酸。', severity: 'dn' as Sev },
    ]
  },
]

export default function BloodTestPage() {
  useEffect(() => { trackToolUsage('interpret-blood-test') }, [])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const results = useMemo(() => { const r: any[] = []; categories.forEach(cat => cat.findings.filter(f => selected.has(f.id)).forEach(f => r.push({ title: `${cat.key}: ${f.label}`, severity: f.severity, detail: f.detail }))); return r }, [selected])
  const sty: Record<Sev, string> = { ok: 'bg-[#E6F4EA] border-l-4 border-[#34A853]', wn: 'bg-[#FFF8E1] border-l-4 border-[#F9A825]', dn: 'bg-[#FDECEA] border-l-4 border-[#D93025]', neutral: 'bg-[#E8F0FE] border-l-4 border-[#4285F4]' }
  const tc: Record<Sev, string> = { ok: 'text-[#1B5E20]', wn: 'text-[#E65100]', dn: 'text-[#B71C1C]', neutral: 'text-[#1565C0]' }

  return (
    <div className="max-w-4xl mx-auto">
      <nav className="text-sm text-muted mb-6"><Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span><Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span><Link href="/tools/interpret" className="hover:text-ac">検査読影</Link><span className="mx-2">›</span><span>血液検査</span></nav>
      <header className="mb-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0">
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">🩸 検査読影</span>
        <h1 className="text-2xl font-bold text-tx mb-1">血液検査 系統的解釈チェックリスト</h1>
        <p className="text-sm text-muted">CBC→生化学→凝固系の順に評価。異常値パターンから鑑別疾患・次のアクションを表示。</p>
      </div><ProPulseHint><FavoriteButton slug="interpret-blood-test" title="血液検査 系統的解釈チェックリスト" /></ProPulseHint></div></header>
      <section className="space-y-4 mb-6">{categories.map(cat => (<div key={cat.key} className="bg-s0 border border-br rounded-xl p-4"><h2 className="text-sm font-bold text-tx mb-1">{cat.title}</h2><p className="text-[11px] text-muted mb-3">{cat.desc}</p><div className="flex flex-wrap gap-2">{cat.findings.map(f => (<button key={f.id} onClick={() => toggle(f.id)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${selected.has(f.id) ? f.severity === 'ok' ? 'bg-[#166534] text-white border-[#166534]' : f.severity === 'dn' ? 'bg-[#991B1B] text-white border-[#991B1B]' : 'bg-[#92400E] text-white border-[#92400E]' : 'bg-bg text-tx border-br hover:border-ac/30'}`}>{selected.has(f.id) ? '✓ ' : ''}{f.label}</button>))}</div></div>))}</section>
      {results.length > 0 && <ProGate feature="interpretation" previewHeight={100}><section className="mb-8"><h2 className="text-lg font-bold text-tx mb-3">推奨アクション（{results.length}所見）</h2><div className="space-y-3">{results.map((r: any, i: number) => (<div key={i} className={`rounded-xl p-4 ${sty[r.severity as Sev]}`}><p className={`text-sm font-bold mb-1 ${tc[r.severity as Sev]}`}>{r.title}</p><p className="text-xs text-tx/80">{r.detail}</p></div>))}</div></section></ProGate>}
      {selected.size === 0 && <div className="bg-s1 border border-br rounded-xl p-6 text-center text-muted text-sm mb-8">上のチェックリストから所見を選択すると、鑑別疾患と解説が表示されます。</div>}
      <div className="bg-wnl border border-wnb rounded-lg p-4 mb-8 text-sm text-wn"><p className="font-semibold mb-1">⚠️ 医療上の免責事項</p><p>本ツールは血液検査結果の系統的解釈を補助するチェックリストです。診断の最終判断は必ず担当医が行ってください。</p></div>
    </div>
  )
}
