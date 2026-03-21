'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('ottawa-sah')!
const items = [
  {id:'age40',label:'40歳以上'},{id:'neck',label:'頸部痛・硬直'},{id:'loc',label:'意識消失の目撃'},{id:'exertion',label:'労作時発症'},
  {id:'thunderclap',label:'雷鳴頭痛（瞬時にピークに達する）'},{id:'flexion',label:'頸部の前屈制限'},
]
export default function OttawaSAHPage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const pos=items.filter(i=>checks[i.id]).length
    if(pos>0) return {score:pos,severity:'dn' as const,label:`陽性（${pos}項目）: SAH除外不可 → 頭部CT + 腰椎穿刺`}
    return {score:0,severity:'ok' as const,label:'全項目陰性: SAH除外可能（感度100%）'}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Ottawa SAH Rule" value={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">Ottawa SAHルールとは</h2><p>15歳以上の非外傷性急性頭痛（1時間以内にピーク）でGCS15の患者が対象。6項目すべて陰性で感度100%（SAH見逃し率ほぼ0%）。陽性なら頭部CT→CT陰性でも腰椎穿刺を検討。</p><p className="text-wn font-medium">⚠️ 適応: 非外傷性、1時間以内にピーク、GCS15、新規の最悪の頭痛。</p></section>}
      relatedTools={[]} references={[{text:'Perry JJ et al. Clinical decision rules to rule out subarachnoid hemorrhage for acute headache. JAMA 2013;310:1248-1255'}]}
    >
      <div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div>
    </CalculatorLayout>
  )
}
