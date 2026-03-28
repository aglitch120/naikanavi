'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('drip-score')!
// Webb BJ 2016: 主要因子(2点)と副次因子(1点)を区別
const items=[
  {id:'immunosuppression',label:'免疫抑制状態',points:2},
  {id:'mrsa',label:'過去1年以内にMRSA感染/保菌',points:2},
  {id:'prior_hosp',label:'過去60日以内の入院・ICU・点滴抗菌薬',points:2},
  {id:'tube',label:'経管栄養',points:2},
  {id:'abx',label:'過去60日以内の経口抗菌薬使用',points:1},
  {id:'chronic_wound',label:'慢性創傷',points:1},
  {id:'nursing',label:'施設入所中',points:1},
  {id:'esrd',label:'慢性腎不全/透析',points:1},
]
export default function DRIPScorePage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const score=items.filter(i=>checks[i.id]).reduce((s,i)=>s+i.points,0)
    if(score>=4) return {score,severity:'dn' as const,label:'DRIPリスク高（≧4）: MRSA/緑膿菌等の耐性菌カバーを検討'}
    return {score,severity:'ok' as const,label:'DRIPリスク低: 標準的な市中肺炎の抗菌薬を参考に選択'}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="DRIP" value={result.score} unit="点" interpretation={result.label} severity={result.severity} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Webb BJ et al. Derivation and Multicenter Validation of the Drug Resistance in Pneumonia Clinical Prediction Score. Antimicrob Agents Chemother 2016'}]}
    ><div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label+' (+'+String(i.points)+'点)'} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}