'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('ipss-prostate')!
const opts=[{label:'0: 全くない',value:'0'},{label:'1: 5回に1回未満',value:'1'},{label:'2: 2回に1回未満',value:'2'},{label:'3: 約2回に1回',value:'3'},{label:'4: 2回に1回以上',value:'4'},{label:'5: ほぼ毎回',value:'5'}]
const qs=[{id:'q1',label:'1. 残尿感'},{id:'q2',label:'2. 2時間以内の再排尿'},{id:'q3',label:'3. 排尿途中の尿線途絶'},{id:'q4',label:'4. 尿意切迫感'},{id:'q5',label:'5. 尿線の勢い低下'},{id:'q6',label:'6. 排尿開始時のいきみ'},{id:'q7',label:'7. 夜間排尿回数',options:[{label:'0回(0)',value:'0'},{label:'1回(1)',value:'1'},{label:'2回(2)',value:'2'},{label:'3回(3)',value:'3'},{label:'4回(4)',value:'4'},{label:'5回以上(5)',value:'5'}]}]
export default function IPSSPage(){
  const [vals,setVals]=useState<Record<string,string>>(Object.fromEntries(qs.map(q=>[q.id,'0'])))
  const result=useMemo(()=>{
    const score=Object.values(vals).reduce((s,v)=>s+Number(v),0)
    if(score>=20) return {score,severity:'dn' as const,label:'重症（20-35）'}
    if(score>=8) return {score,severity:'wn' as const,label:'中等症（8-19）'}
    return {score,severity:'ok' as const,label:'軽症（0-7）'}
  },[vals])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="IPSS" value={result.score} unit="/35点" interpretation={result.label} severity={result.severity} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Barry MJ et al. The American Urological Association symptom index for benign prostatic hyperplasia. J Urol 1992;148:1549-1557'}]}
    ><div className="space-y-3">{qs.map(q=><RadioGroup key={q.id} id={q.id} label={q.label} options={q.options || opts} value={vals[q.id]} onChange={v=>setVals(p=>({...p,[q.id]:v}))} />)}</div></CalculatorLayout>
  )
}