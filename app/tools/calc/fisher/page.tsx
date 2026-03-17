'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('fisher')!
const grades = [
  {label:'Grade 1: 血液なし',value:'1',risk:'脳血管攣縮リスク: 低い (21%)'},
  {label:'Grade 2: びまん性の薄い血液層（<1mm）',value:'2',risk:'脳血管攣縮リスク: 中等度 (25%)'},
  {label:'Grade 3: 局所的な厚い血腫 or びまん性の厚い血液層（>1mm）',value:'3',risk:'脳血管攣縮リスク: 高い (37%)'},
  {label:'Grade 4: びまん性 or 血液なし + 脳室内/脳内血腫',value:'4',risk:'脳血管攣縮リスク: 中等度 (31%)'},
]
export default function FisherPage(){
  const [grade,setGrade]=useState('1')
  const result=useMemo(()=>{
    const g=grades.find(g=>g.value===grade)!
    const sev=grade==='3'?'dn' as const:grade==='1'?'ok' as const:'wn' as const
    return {grade:Number(grade),risk:g.risk,severity:sev}
  },[grade])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Fisher" value={`Grade ${result.grade}`} interpretation={result.risk} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">Fisher分類とは</h2><p>SAHの初回CTでの出血パターンにより脳血管攣縮（vasospasm）のリスクを予測。Grade 3が最もvasospasmリスクが高い。Modified Fisher分類では脳室内出血の有無を加味。</p></section>}
      relatedTools={[]} references={[{text:'Fisher CM et al. Relation of cerebral vasospasm to subarachnoid hemorrhage visualized by computerized tomographic scanning. Neurosurgery 1980;6:1-9'}]}
    >
      <RadioGroup id="fisher" label="CT所見" options={grades.map(g=>({label:g.label,value:g.value}))} value={grade} onChange={setGrade} />
    </CalculatorLayout>
  )
}
