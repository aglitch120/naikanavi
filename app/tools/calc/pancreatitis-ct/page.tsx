'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('pancreatitis-ct')!
const balthazar = [
  { label: 'Grade A: 正常膵', score: 0 },
  { label: 'Grade B: 膵の限局性/びまん性腫大', score: 1 },
  { label: 'Grade C: 膵周囲脂肪織の炎症性変化', score: 2 },
  { label: 'Grade D: 膵内外の単発液貯留', score: 3 },
  { label: 'Grade E: 2カ所以上の液貯留 or 膵周囲のガス像', score: 4 },
]
const necrosis = [
  { label: '壊死なし', score: 0 },
  { label: '壊死 ≦30%', score: 2 },
  { label: '壊死 30-50%', score: 4 },
  { label: '壊死 >50%', score: 6 },
]
export default function PancreatitisCTPage() {
  const [bIdx, setBIdx] = useState(0)
  const [nIdx, setNIdx] = useState(0)
  const result = useMemo(() => {
    const ctsi = balthazar[bIdx].score + necrosis[nIdx].score
    let severity: 'ok'|'wn'|'dn' = 'ok', interpretation = ''
    if (ctsi <= 3) { interpretation = `CTSI ${ctsi}/10 — 軽症。合併症率8%` }
    else if (ctsi <= 6) { interpretation = `CTSI ${ctsi}/10 — 中等症。合併症率35%`; severity = 'wn' }
    else { interpretation = `CTSI ${ctsi}/10 — 重症。合併症率92%`; severity = 'dn' }
    return { ctsi, severity, interpretation }
  }, [bIdx, nIdx])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={`CTSI = ${result.ctsi}/10`} interpretation={result.interpretation} />}
      explanation={<div className="text-sm text-muted"><p>Balthazar CT Grade(0-4) + 壊死スコア(0-6) = CTSI(0-10)。造影CTは発症72時間以降が壊死の評価に最適。</p></div>}
      relatedTools={[{slug:'pancreatitis-prognostic',name:'膵炎予後因子'},{slug:'ranson',name:'Ranson'}]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-4">
        <div><p className="text-sm font-bold text-tx mb-2">Balthazar CT Grade</p>
          {balthazar.map((b,i)=>(
            <label key={i} className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer mb-1 ${bIdx===i?'bg-acl border border-ac/30':'bg-s0 border border-br'}`}>
              <input type="radio" name="b" checked={bIdx===i} onChange={()=>setBIdx(i)} className="accent-[var(--ac)]"/>
              <span className="text-xs text-tx">{b.label} ({b.score}点)</span>
            </label>))}
        </div>
        <div><p className="text-sm font-bold text-tx mb-2">膵壊死の範囲</p>
          {necrosis.map((n,i)=>(
            <label key={i} className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer mb-1 ${nIdx===i?'bg-acl border border-ac/30':'bg-s0 border border-br'}`}>
              <input type="radio" name="n" checked={nIdx===i} onChange={()=>setNIdx(i)} className="accent-[var(--ac)]"/>
              <span className="text-xs text-tx">{n.label} ({n.score}点)</span>
            </label>))}
        </div>
      </div>
    </CalculatorLayout>
  )
}
