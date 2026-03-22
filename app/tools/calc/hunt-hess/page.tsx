'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('hunt-hess')!
const grades = [
  {label:'Grade I: 無症状 or 軽度頭痛・項部硬直',value:'1',mort:'30日死亡率 1%'},
  {label:'Grade II: 中等度〜重度の頭痛・項部硬直、脳神経麻痺以外の神経脱落なし',value:'2',mort:'30日死亡率 5%'},
  {label:'Grade III: 傾眠、軽度の局所神経脱落',value:'3',mort:'30日死亡率 15-20%'},
  {label:'Grade IV: 昏迷、中等度〜重度の片麻痺、除脳硬直初期',value:'4',mort:'30日死亡率 20-40%'},
  {label:'Grade V: 深昏睡、除脳硬直、瀕死状態',value:'5',mort:'30日死亡率 50-80%'},
]
export default function HuntHessPage(){
  const [grade,setGrade]=useState('1')
  const result=useMemo(()=>{
    const g=grades.find(g=>g.value===grade)!
    const sev = Number(grade)<=2?'ok' as const:Number(grade)<=3?'wn' as const:'dn' as const
    return {grade:Number(grade),label:g.label,mort:g.mort,severity:sev}
  },[grade])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Hunt and Hess" value={`Grade ${result.grade}`} interpretation={`${result.mort}`} severity={result.severity} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Hunt WE, Hess RM. Surgical risk as related to time of intervention in the repair of intracranial aneurysms. J Neurosurg 1968;28:14-20'}]}
    >
      <RadioGroup id="grade" label="臨床所見" options={grades.map(g=>({label:g.label,value:g.value}))} value={grade} onChange={setGrade} />
    </CalculatorLayout>
  )
}
