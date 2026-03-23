'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('pancreatitis-prognostic')!
const items = [
  'BE ≦ -3 mEq/L or ショック(sBP≦80)',
  'PaO₂ ≦ 60 mmHg (room air) or 呼吸不全(人工呼吸管理)',
  'BUN ≧ 40 mg/dL (or Cr ≧ 2.0) or 乏尿(日尿量≦400mL/日)',
  'LDH ≧ 基準上限の2倍',
  'Plt ≦ 10万/μL',
  'Ca ≦ 7.5 mg/dL',
  'CRP ≧ 15 mg/dL',
  'SIRS基準3項目以上',
  '年齢 ≧ 70歳',
]
export default function PancreatitisPrognosticPage() {
  const [checked, setChecked] = useState<boolean[]>(items.map(()=>false))
  const result = useMemo(() => {
    const total = checked.filter(Boolean).length
    let severity: 'ok'|'wn'|'dn' = 'ok', interpretation = ''
    if (total >= 3) { interpretation = `${total}/9項目 — 重症。ICU管理・専門施設への搬送を検討`; severity = 'dn' }
    else if (total >= 2) { interpretation = `${total}/9項目 — 中等症の可能性。48時間以内の再評価が必要`; severity = 'wn' }
    else { interpretation = `${total}/9項目 — 軽症の可能性が高い` }
    return { total, severity, interpretation }
  }, [checked])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={`予後因子 ${result.total}/9`} interpretation={result.interpretation} />}
      explanation={<div className="text-sm text-muted"><p>≧3項目で重症。予後因子と造影CTグレード(Balthazar)を合わせてseverity indexを算出。入院48時間以内に評価。</p></div>}
      relatedTools={[{slug:'pancreatitis-ct',name:'膵炎CTグレード'},{slug:'ranson',name:'Ranson'},{slug:'bisap',name:'BISAP'}]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-2">{items.map((item,i)=>(
        <label key={i} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${checked[i]?'bg-wnl border border-wnb':'bg-s0 border border-br'}`}>
          <input type="checkbox" checked={checked[i]} onChange={()=>{const n=[...checked];n[i]=!n[i];setChecked(n)}} className="accent-[var(--ac)]"/>
          <span className="text-sm text-tx">{item}</span>
        </label>
      ))}</div>
    </CalculatorLayout>
  )
}
