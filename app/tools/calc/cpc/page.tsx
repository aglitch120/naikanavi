'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('cpc')!
const levels=[
  {label:'CPC 1: 良好 — 正常な脳機能、軽度の障害はあっても日常生活に支障なし',value:'1'},
  {label:'CPC 2: 中等度障害 — 独立した日常生活は可能、保護的環境でのパートタイム就労可能',value:'2'},
  {label:'CPC 3: 重度障害 — 意識あり、日常生活に他者の援助が必要',value:'3'},
  {label:'CPC 4: 昏睡/植物状態 — 意識なし',value:'4'},
  {label:'CPC 5: 脳死/死亡',value:'5'},
]
export default function CPCPage(){
  const [val,setVal]=useState('1')
  const v=Number(val);const sev=v<=2?'ok' as const:v<=3?'wn' as const:'dn' as const
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="CPC" value={`CPC ${val}`} interpretation={v<=2?'良好な神経学的予後':v===3?'重度障害':'不良'} severity={sev} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Brain Resuscitation Clinical Trial Study Group. JAMA 1986;255:244-249'}]}
    ><RadioGroup id="cpc" label="神経学的転帰" options={levels} value={val} onChange={setVal} /></CalculatorLayout>
  )
}
