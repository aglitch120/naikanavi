'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('stop-bang')!
const items=[{id:'snoring',label:'S: 大きないびき'},{id:'tired',label:'T: 昼間の眠気'},{id:'observed',label:'O: 睡眠中の呼吸停止の指摘'},{id:'pressure',label:'P: 高血圧'},{id:'bmi',label:'B: BMI > 35'},{id:'age',label:'A: 50歳以上'},{id:'neck',label:'N: 首周り > 40cm'},{id:'gender',label:'G: 男性'}]
export default function StopBangPage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const score=items.filter(i=>checks[i.id]).length
    if(score>=5) return {score,severity:'dn' as const,label:'高リスク（5-8）: 中等度〜重度OSAS → PSG'}
    if(score>=3) return {score,severity:'wn' as const,label:'中リスク（3-4）: OSAS疑い → PSG検討'}
    return {score,severity:'ok' as const,label:'低リスク（0-2）'}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="STOP-Bang" value={result.score} unit="/8" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">STOP-Bangとは</h2><p>OSASスクリーニング。8項目。≧3でOSAS疑い。術前評価にも重要。</p></section>}
      relatedTools={[]} references={[{text:'Chung F et al. Chest 2016;149:631-638'}]}
    ><div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}