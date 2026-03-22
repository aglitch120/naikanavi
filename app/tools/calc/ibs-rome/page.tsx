'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('ibs-rome')!
const items=[{id:'pain',label:'反復する腹痛（最近3ヶ月で週1日以上）'},{id:'defecation',label:'排便に関連する'},{id:'frequency',label:'排便頻度の変化に関連する'},{id:'form',label:'便形状の変化に関連する'}]
export default function Page(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const count=useMemo(()=>items.filter(i=>checks[i.id]).length,[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="IBS診断基準(Rome IV)" value={count+'/'+items.length+'項目'} interpretation={count>=Math.ceil(items.length/2)?'基準を満たす可能性あり':'基準を満たさない'} severity={count>=Math.ceil(items.length/2)?'wn' as const:'ok' as const} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'過敏性腸症候群の診断基準'}]}
    ><div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))}/>)}</div></CalculatorLayout>
  )
}