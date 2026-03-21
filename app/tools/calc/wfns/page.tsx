'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('wfns')!
const grades = [
  {label:'Grade I: GCS 15, 局所神経脱落なし',value:'1'},{label:'Grade II: GCS 13-14, 局所神経脱落なし',value:'2'},
  {label:'Grade III: GCS 13-14, 局所神経脱落あり',value:'3'},{label:'Grade IV: GCS 7-12',value:'4'},{label:'Grade V: GCS 3-6',value:'5'},
]
export default function WFNSPage(){
  const [grade,setGrade]=useState('1')
  const result=useMemo(()=>{
    const g=Number(grade);const sev=g<=2?'ok' as const:g===3?'wn' as const:'dn' as const
    return {grade:g,severity:sev,label:grades.find(x=>x.value===grade)!.label}
  },[grade])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="WFNS Grade" value={`Grade ${result.grade}`} interpretation={result.grade<=2?'良好な予後':result.grade===3?'中等度':'不良な予後'} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">WFNS分類とは</h2><p>World Federation of Neurological Surgeonsによるくも膜下出血の重症度分類。GCSと局所神経脱落の有無に基づく。国際的に最も広く使用される。</p></section>}
      relatedTools={[]} references={[{text:'Report of WFNS Committee on a Universal SAH Grading Scale. J Neurosurg 1988;68:985-986'}]}
    >
      <RadioGroup id="wfns" label="GCS + 神経学的所見" options={grades.map(g=>({label:g.label,value:g.value}))} value={grade} onChange={setGrade} />
    </CalculatorLayout>
  )
}
