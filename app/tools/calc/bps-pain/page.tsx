'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('bps-pain')!
const items=[
  {id:'face',label:'表情',options:[{label:'弛緩(1)',value:'1'},{label:'一部緊張(2)',value:'2'},{label:'全面的緊張(3)',value:'3'},{label:'しかめ面(4)',value:'4'}]},
  {id:'upper',label:'上肢の動き',options:[{label:'動きなし(1)',value:'1'},{label:'一部屈曲(2)',value:'2'},{label:'チューブを引っ張る等(3)',value:'3'},{label:'持続的に屈曲(4)',value:'4'}]},
  {id:'vent',label:'人工呼吸器順応',options:[{label:'順応良好(1)',value:'1'},{label:'時々咳嗽(2)',value:'2'},{label:'ファイティング(3)',value:'3'},{label:'呼吸器制御不能(4)',value:'4'}]},
]
export default function BPSPage(){
  const [vals,setVals]=useState<Record<string,string>>(Object.fromEntries(items.map(i=>[i.id,'1'])))
  const result=useMemo(()=>{
    const score=Object.values(vals).reduce((s,v)=>s+Number(v),0)
    return {score,severity:score>=6?'wn' as const:'ok' as const,label:score>=6?'有意な疼痛あり（≧6）→ 鎮痛薬投与/増量':'疼痛なし/軽度（3-5）'}
  },[vals])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="BPS" value={result.score} unit="/12点" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">BPSとは</h2><p>Behavioral Pain Scale。鎮静下の挿管患者の疼痛を3項目（表情/上肢/呼吸器順応）で評価。3-12点。≧6で有意な疼痛。CPOTとともにPADISガイドラインでが一般的。</p></section>}
      relatedTools={[]} references={[{text:'Payen JF et al. Assessing pain in critically ill sedated patients by using a behavioral pain scale. Crit Care Med 2001;29:2258-2263'}]}
    ><div className="space-y-4">{items.map(i=><RadioGroup key={i.id} id={i.id} label={i.label} options={i.options} value={vals[i.id]} onChange={v=>setVals(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}
