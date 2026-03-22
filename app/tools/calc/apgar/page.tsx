'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('apgar')!
const items=[
  {id:'appearance',label:'外観 (Appearance)',options:[{label:'全身チアノーゼ/蒼白',value:'0'},{label:'四肢のみチアノーゼ',value:'1'},{label:'全身ピンク',value:'2'}]},
  {id:'pulse',label:'脈拍 (Pulse)',options:[{label:'なし',value:'0'},{label:'<100/min',value:'1'},{label:'≧100/min',value:'2'}]},
  {id:'grimace',label:'刺激反応 (Grimace)',options:[{label:'反応なし',value:'0'},{label:'しかめ面',value:'1'},{label:'啼泣・くしゃみ・咳',value:'2'}]},
  {id:'activity',label:'筋緊張 (Activity)',options:[{label:'弛緩',value:'0'},{label:'四肢をやや屈曲',value:'1'},{label:'活発な動き',value:'2'}]},
  {id:'respiration',label:'呼吸 (Respiration)',options:[{label:'なし',value:'0'},{label:'弱い・不規則',value:'1'},{label:'強い啼泣',value:'2'}]},
]
export default function ApgarPage(){
  const [vals,setVals]=useState<Record<string,string>>(Object.fromEntries(items.map(i=>[i.id,'2'])))
  const result=useMemo(()=>{
    const score=Object.values(vals).reduce((s,v)=>s+Number(v),0)
    if(score>=7) return {score,severity:'ok' as const,label:'正常（7-10）: 良好な状態'}
    if(score>=4) return {score,severity:'wn' as const,label:'中等度仮死（4-6）: 刺激・吸引・酸素投与'}
    return {score,severity:'dn' as const,label:'重度仮死（0-3）: 積極的蘇生が必要'}
  },[vals])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="APGAR" value={result.score} unit="/10点" interpretation={result.label} severity={result.severity} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Apgar V. A proposal for a new method of evaluation of the newborn infant. Curr Res Anesth Analg 1953;32:260-267'}]}
    >
      <div className="space-y-4">{items.map(i=><RadioGroup key={i.id} id={i.id} label={i.label} options={i.options} value={vals[i.id]} onChange={v=>setVals(p=>({...p,[i.id]:v}))} />)}</div>
    </CalculatorLayout>
  )
}
