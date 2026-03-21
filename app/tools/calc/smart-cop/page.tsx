'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('smart-cop')!
const items=[
  {id:'sbp',label:'S: 収縮期血圧 < 90mmHg',points:2},
  {id:'multilobar',label:'M: 胸部X線で多葉性浸潤影',points:1},
  {id:'albumin',label:'A: アルブミン < 3.5g/dL',points:1},
  {id:'rr',label:'R: 呼吸数 ≧25（≧50歳）or ≧30（<50歳）',points:1},
  {id:'tachy',label:'T: 頻脈 ≧125/min',points:1},
  {id:'confusion',label:'C: 意識変容（新規発症）',points:1},
  {id:'o2',label:'O: PaO₂<70（≧50歳）or <60（<50歳）or SpO₂<93%',points:2},
  {id:'ph',label:'P: pH < 7.35',points:2},
]
export default function SMARTCOPPage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const score=items.filter(i=>checks[i.id]).reduce((s,i)=>s+i.points,0)
    if(score>=5) return {score,severity:'dn' as const,label:'高リスク（≧5）: ICU/人工呼吸器/昇圧薬が必要な可能性高い'}
    if(score>=3) return {score,severity:'wn' as const,label:'中リスク（3-4）: ICU入室を検討（1/8の確率で集中治療が必要）'}
    return {score,severity:'ok' as const,label:'低リスク（0-2）: 集中治療が必要になる可能性は低い'}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="SMART-COP" value={result.score} unit="/11点" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">SMART-COPとは</h2><p>市中肺炎で集中治療（ICU/人工呼吸器/昇圧薬）が必要になるかを予測。8項目11点満点。CURB-65やPSI/PORTとは異なり、ICU入室の必要性に特化。≧3でICU考慮、≧5で高確率。</p></section>}
      relatedTools={[]} references={[{text:'Charles PG et al. SMART-COP: a tool for predicting the need for intensive respiratory or vasopressor support in community-acquired pneumonia. Clin Infect Dis 2008;47:375-384'}]}
    >
      <div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={`${i.label} (+${i.points}点)`} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div>
    </CalculatorLayout>
  )
}
