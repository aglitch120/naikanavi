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
    key: 'Dipstick', title: '試験紙検査（定性）',
    desc: '蛋白・潜血・糖・ケトン・白血球エステラーゼ・亜硝酸塩・比重・pH',
    findings: [
      { id: 'dipstick_normal', label: '試験紙 全項目正常', detail: '蛋白(-)・潜血(-)・糖(-)・ケトン(-)・WBC(-)・亜硝酸塩(-)。正常所見。', severity: 'ok' as Sev },
      { id: 'proteinuria', label: '蛋白尿（+以上）', detail: '蛋白尿: 起立性（良性）・一過性（発熱・運動後）→再検で陰性化。持続性→糸球体疾患（IgA腎症・DKD・MN等）・尿細管障害。定量（g/gCr or 24h蓄尿）で評価。> 3.5g/日はネフローゼ症候群。', severity: 'wn' as Sev },
      { id: 'hematuria', label: '潜血（+以上）', detail: '血尿: 顕微鏡で赤血球形態確認。糸球体性（変形赤血球・赤血球円柱）→IgA腎症・ANCA関連腎炎。非糸球体性（均一赤血球）→尿路結石・腫瘍・感染。40歳以上の肉眼的血尿は泌尿器科精査。', severity: 'wn' as Sev },
      { id: 'glucosuria', label: '糖尿（+以上）', detail: '尿糖: 血糖 > 170-180 mg/dLで出現（腎閾値）。糖尿病のスクリーニング。血糖正常+糖尿→腎性糖尿（Fanconi症候群・SGLT2i使用中）。', severity: 'wn' as Sev },
      { id: 'ketonuria', label: 'ケトン体（+以上）', detail: 'ケトン尿: DKA・飢餓・嘔吐・激しい運動。糖尿病患者でケトン尿+高血糖→DKAを疑い血液ガス・血中ケトン体を確認。', severity: 'wn' as Sev },
      { id: 'leukocyte_est', label: '白血球エステラーゼ（+）', detail: '白血球エステラーゼ陽性: 膿尿（尿中WBC増加）を示唆。尿路感染症の可能性。亜硝酸塩と併せて評価。', severity: 'wn' as Sev },
      { id: 'nitrite', label: '亜硝酸塩（+）', detail: '亜硝酸塩陽性: グラム陰性桿菌（大腸菌等）による尿路感染を示唆。感度60%程度（陰性でもUTI否定できず）。尿培養提出。', severity: 'wn' as Sev },
      { id: 'low_sg', label: '比重低下（< 1.005）', detail: '低比重: 水分過剰摂取・尿崩症・慢性腎不全（濃縮力低下）。尿崩症は浸透圧も低下。水制限試験で中枢性 vs 腎性を鑑別。', severity: 'wn' as Sev },
      { id: 'high_sg', label: '比重上昇（> 1.030）', detail: '高比重: 脱水・造影剤投与後・糖尿（高浸透圧）。SIADH（尿浸透圧 > 血漿浸透圧）。', severity: 'neutral' as Sev },
    ]
  },
  {
    key: 'Sediment', title: '尿沈渣',
    desc: '赤血球・白血球・円柱・結晶・細菌',
    findings: [
      { id: 'sediment_normal', label: '尿沈渣 正常', detail: 'RBC < 5/HPF, WBC < 5/HPF, 円柱なし, 細菌なし。正常所見。', severity: 'ok' as Sev },
      { id: 'dysmorphic_rbc', label: '変形赤血球 / 赤血球円柱', detail: '糸球体性血尿の確定所見。IgA腎症・ANCA関連血管炎・ループス腎炎・RPGN等を鑑別。腎生検の適応を検討。緊急性の評価（急速進行性かどうか）。', severity: 'dn' as Sev },
      { id: 'pyuria', label: 'WBC > 10/HPF（膿尿）', detail: '膿尿: 尿路感染症（大腸菌が最多）。無菌性膿尿→結核・間質性腎炎・尿路結石・カテーテル関連を鑑別。培養陰性なら抗酸菌培養も。', severity: 'wn' as Sev },
      { id: 'granular_cast', label: '顆粒円柱', detail: '顆粒円柱: 腎実質障害を示唆。粗大顆粒→急性尿細管壊死(ATN)。蝋様円柱→慢性腎不全。脂肪円柱→ネフローゼ症候群。', severity: 'wn' as Sev },
      { id: 'waxy_cast', label: '蝋様円柱 / 幅広円柱', detail: '蝋様円柱: 高度の腎不全・尿細管の拡張を示唆。慢性腎臓病の進行を反映。', severity: 'dn' as Sev },
      { id: 'bacteria', label: '細菌（+）', detail: '尿中細菌: 尿路感染症を示唆（ただし汚染の可能性も）。中間尿で再評価。培養（> 10⁵ CFU/mL）で確定。カテーテル尿は10³で有意。', severity: 'wn' as Sev },
      { id: 'crystals_urate', label: '尿酸結晶', detail: '尿酸結晶: 高尿酸血症・脱水・酸性尿で出現。腫瘍崩壊症候群で大量に出現→急性尿酸腎症のリスク。アルカリ化+補液。', severity: 'wn' as Sev },
      { id: 'crystals_oxalate', label: 'シュウ酸Ca結晶', detail: 'シュウ酸カルシウム結晶: 尿路結石のリスク。エチレングリコール中毒でも大量出現（重要な手がかり）。', severity: 'wn' as Sev },
    ]
  },
]

export default function UrinalysisPage() {
  useEffect(() => { trackToolUsage('interpret-urinalysis') }, [])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const results = useMemo(() => { const r: any[] = []; categories.forEach(cat => cat.findings.filter(f => selected.has(f.id)).forEach(f => r.push({ title: `${cat.key}: ${f.label}`, severity: f.severity, detail: f.detail }))); return r }, [selected])
  const sty: Record<Sev, string> = { ok: 'bg-[#E6F4EA] border-l-4 border-[#34A853]', wn: 'bg-[#FFF8E1] border-l-4 border-[#F9A825]', dn: 'bg-[#FDECEA] border-l-4 border-[#D93025]', neutral: 'bg-[#E8F0FE] border-l-4 border-[#4285F4]' }
  const tc: Record<Sev, string> = { ok: 'text-[#1B5E20]', wn: 'text-[#E65100]', dn: 'text-[#B71C1C]', neutral: 'text-[#1565C0]' }

  return (
    <div className="max-w-4xl mx-auto">
      <nav className="text-sm text-muted mb-6"><Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span><Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span><Link href="/tools/interpret" className="hover:text-ac">検査読影</Link><span className="mx-2">›</span><span>尿検査</span></nav>
      <header className="mb-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0">
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">🧪 検査読影</span>
        <h1 className="text-2xl font-bold text-tx mb-1">尿検査 系統的解釈チェックリスト</h1>
        <p className="text-sm text-muted">試験紙→尿沈渣の順に評価。異常パターンから腎疾患・尿路感染症・代謝異常を鑑別。</p>
      </div><ProPulseHint><FavoriteButton slug="interpret-urinalysis" title="尿検査 系統的解釈チェックリスト" /></ProPulseHint></div></header>
      <section className="space-y-4 mb-6">{categories.map(cat => (<div key={cat.key} className="bg-s0 border border-br rounded-xl p-4"><h2 className="text-sm font-bold text-tx mb-1">{cat.title}</h2><p className="text-[11px] text-muted mb-3">{cat.desc}</p><div className="flex flex-wrap gap-2">{cat.findings.map(f => (<button key={f.id} onClick={() => toggle(f.id)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${selected.has(f.id) ? f.severity === 'ok' ? 'bg-[#166534] text-white border-[#166534]' : f.severity === 'dn' ? 'bg-[#991B1B] text-white border-[#991B1B]' : f.severity === 'neutral' ? 'bg-ac text-white border-ac' : 'bg-[#92400E] text-white border-[#92400E]' : 'bg-bg text-tx border-br hover:border-ac/30'}`}>{selected.has(f.id) ? '✓ ' : ''}{f.label}</button>))}</div></div>))}</section>
      {results.length > 0 && <ProGate feature="interpretation" previewHeight={100}><section className="mb-8"><h2 className="text-lg font-bold text-tx mb-3">推奨アクション（{results.length}所見）</h2><div className="space-y-3">{results.map((r: any, i: number) => (<div key={i} className={`rounded-xl p-4 ${sty[r.severity as Sev]}`}><p className={`text-sm font-bold mb-1 ${tc[r.severity as Sev]}`}>{r.title}</p><p className="text-xs text-tx/80">{r.detail}</p></div>))}</div></section></ProGate>}
      {selected.size === 0 && <div className="bg-s1 border border-br rounded-xl p-6 text-center text-muted text-sm mb-8">上のチェックリストから所見を選択すると、鑑別疾患と解説が表示されます。</div>}
      <div className="bg-wnl border border-wnb rounded-lg p-4 mb-8 text-sm text-wn"><p className="font-semibold mb-1">⚠️ 医療上の免責事項</p><p>本ツールは尿検査結果の系統的解釈を補助するチェックリストです。診断の最終判断は必ず担当医が行ってください。</p></div>
    </div>
  )
}
