'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('stone-score')!
const items=[
  {id:'sex',label:'S: 男性',points:2},{id:'timing',label:'T: 短時間の疼痛（6-24h以内に発症→ER受診）',points:3},
  {id:'origin',label:'O: 非黒人',points:3},{id:'nausea',label:'N: 悪心/嘔吐あり',points:1},
  {id:'erythrocyte',label:'E: 尿中赤血球 > 0 /HPF',points:3},
]
export default function STONEPage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const score=items.filter(i=>checks[i.id]).reduce((s,i)=>s+i.points,0)
    if(score>=10) return {score,severity:'wn' as const,label:'高リスク（10-13）: 尿路結石の確率約90% → CT施行'}
    if(score>=6) return {score,severity:'wn' as const,label:'中リスク（6-9）: 尿路結石の確率約50% → CT検討'}
    return {score,severity:'ok' as const,label:'低リスク（0-5）: 尿路結石の確率約10%'}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="STONE" value={result.score} unit="/13点" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">STONEスコアとは</h2><p>5項目(Sex/Timing/Origin/Nausea/Erythrocytes)で尿路結石の確率を予測。高スコアではCT不要で結石として対応可能な場合も。低スコアでは他疾患の鑑別を。</p></section>}
      relatedTools={[]} references={[{text:'Moore CL et al. Derivation and validation of a clinical prediction rule for uncomplicated ureteral stone. Acad Emerg Med 2014;21:1-10'}]}
    ><div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={`${i.label} (+${i.points}点)`} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}
