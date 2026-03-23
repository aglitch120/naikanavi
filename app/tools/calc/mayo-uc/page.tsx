'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('mayo-uc')!
const items = [
  { name: '排便回数', options: ['正常 (0)','1-2回/日 多い (1)','3-4回/日 多い (2)','≧5回/日 多い (3)'] },
  { name: '直腸出血', options: ['なし (0)','排便の半数未満に血線 (1)','ほとんどの排便に血液 (2)','血液のみ排出 (3)'] },
  { name: '内視鏡所見', options: ['正常/非活動性 (0)','軽度（発赤・血管透見低下） (1)','中等度（著明な発赤・びらん） (2)','重度（自然出血・潰瘍） (3)'] },
  { name: '医師による総合評価', options: ['正常 (0)','軽症 (1)','中等症 (2)','重症 (3)'] },
]
export default function MayoUcPage() {
  const [scores, setScores] = useState([1,1,1,1])
  const result = useMemo(() => {
    const total = scores.reduce((a,b)=>a+b,0)
    let severity: 'ok'|'wn'|'dn' = 'ok', activity = ''
    if (total <= 2) { activity = '寛解 (0-2)' }
    else if (total <= 5) { activity = '軽度活動性 (3-5)'; severity = 'wn' }
    else if (total <= 10) { activity = '中等度活動性 (6-10)'; severity = 'wn' }
    else { activity = '重度活動性 (11-12)'; severity = 'dn' }
    return { total, activity, severity }
  }, [scores])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={`Mayo = ${result.total}/12`} interpretation={result.activity} />}
      explanation={<div className="text-sm text-muted"><p>内視鏡を含まないPartial Mayo(0-9点)も使用可。臨床試験ではMayo 6以上を中等度以上の活動性と定義。</p></div>}
      relatedTools={[{slug:'ibs-rome',name:'IBS Rome IV'}]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-4">{items.map((item,i)=>(
        <div key={i}>
          <p className="text-sm font-bold text-tx mb-1.5">{item.name}</p>
          <div className="space-y-1">{item.options.map((opt,j)=>(
            <label key={j} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all ${scores[i]===j?'bg-acl border border-ac/30':'bg-s0 border border-br'}`}>
              <input type="radio" name={`q-${i}`} checked={scores[i]===j} onChange={()=>{const n=[...scores];n[i]=j;setScores(n)}} className="mt-0.5 accent-[var(--ac)]"/>
              <span className="text-xs text-tx">{opt}</span>
            </label>
          ))}</div>
        </div>
      ))}</div>
    </CalculatorLayout>
  )
}
