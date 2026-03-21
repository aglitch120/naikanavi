'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('cpot')!
const items=[
  {id:'face',label:'表情',options:[{label:'弛緩(0)',value:'0'},{label:'緊張(1)',value:'1'},{label:'しかめ面(2)',value:'2'}]},
  {id:'body',label:'身体動作',options:[{label:'なし(0)',value:'0'},{label:'防御動作(1)',value:'1'},{label:'刺激部位を触る/チューブを引っ張る(2)',value:'2'}]},
  {id:'muscle',label:'筋緊張(上肢の他動屈伸)',options:[{label:'弛緩(0)',value:'0'},{label:'抵抗あり(1)',value:'1'},{label:'強い抵抗/屈曲不能(2)',value:'2'}]},
  {id:'vent',label:'人工呼吸器順応/発声',options:[{label:'アラームなし/発声なし(0)',value:'0'},{label:'アラーム自然停止/うめき(1)',value:'1'},{label:'非同調/泣く(2)',value:'2'}]},
]
export default function CPOTPage(){
  const [vals,setVals]=useState<Record<string,string>>(Object.fromEntries(items.map(i=>[i.id,'0'])))
  const result=useMemo(()=>{
    const score=Object.values(vals).reduce((s,v)=>s+Number(v),0)
    return {score,severity:score>=3?'wn' as const:'ok' as const,label:score>=3?'疼痛あり（≧3）→ 鎮痛薬の投与/増量を検討':'疼痛なし/軽度（0-2）'}
  },[vals])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="CPOT" value={result.score} unit="/8点" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">CPOTとは</h2><p>Critical-Care Pain Observation Tool。自己申告できないICU患者の疼痛を4項目（表情/身体動作/筋緊張/人工呼吸器順応or発声）で客観的に評価。≧3で有意な疼痛。PADISガイドラインでが一般的。</p></section>}
      relatedTools={[]} references={[{text:'Gélinas C et al. Validation of the critical-care pain observation tool in adult patients. Am J Crit Care 2006;15:420-427'}]}
    ><div className="space-y-4">{items.map(i=><RadioGroup key={i.id} id={i.id} label={i.label} options={i.options} value={vals[i.id]} onChange={v=>setVals(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}
