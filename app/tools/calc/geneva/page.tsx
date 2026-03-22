'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('geneva')!
const items = [
  {id:'age65',label:'65歳以上',points:1},{id:'dvt_pe',label:'DVT or PE の既往',points:3},{id:'surgery',label:'1ヶ月以内の手術 or 骨折',points:2},
  {id:'cancer',label:'活動性悪性腫瘍',points:2},{id:'unilateral',label:'片側下肢痛',points:3},{id:'hemoptysis',label:'喀血',points:2},
  {id:'hr75',label:'心拍数 75-94 bpm',points:3},{id:'hr95',label:'心拍数 ≧95 bpm',points:5},{id:'dvt_tender',label:'下肢深部静脈の触診での疼痛 + 片側浮腫',points:4},
]
export default function GenevaPage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    let score=items.filter(i=>checks[i.id]).reduce((s,i)=>s+i.points,0)
    if(checks.hr95) score-=checks.hr75?3:0 // hr75とhr95は排他
    if(score>=11) return {score,severity:'dn' as const,label:'高リスク: CT肺動脈造影(CTPA)を施行'}
    if(score>=4) return {score,severity:'wn' as const,label:'中リスク: D-dimer → 陽性ならCTPA'}
    return {score,severity:'ok' as const,label:'低リスク: D-dimer → 陰性なら除外'}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="改訂Geneva" value={result.score} unit="点" interpretation={result.label} severity={result.severity} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Le Gal G et al. Prediction of pulmonary embolism in the emergency department: the revised Geneva score. Ann Intern Med 2006;144:165-171'}]}
    >
      <div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={`${i.label} (+${i.points}点)`} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div>
    </CalculatorLayout>
  )
}
