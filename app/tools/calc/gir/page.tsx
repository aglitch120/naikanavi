'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('gir')!
export default function GIRPage(){
  const [weight,setWeight]=useState('60')
  const [glucose,setGlucose]=useState('5')
  const [rate,setRate]=useState('80')
  const result=useMemo(()=>{
    const w=Number(weight)||1;const g=Number(glucose)||0;const r=Number(rate)||0
    const gir=(g/100*r*1000)/(w*60)
    const sev=gir>=4&&gir<=6?'ok' as const:gir<4?'wn' as const:gir>8?'dn' as const:'wn' as const
    return {gir:gir.toFixed(2),severity:sev,label:gir<4?'投与速度低い（通常4-6が目標）':gir<=6?'適正範囲（4-6 mg/kg/min）':gir<=8?'やや高め（耐糖能に注意）':'高い（高血糖リスク）'}
  },[weight,glucose,rate])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="GIR" value={result.gir} unit="mg/kg/min" interpretation={result.label} severity={result.severity} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'日本静脈経腸栄養学会. 静脈経腸栄養ガイドライン 第3版'}]}
    >
      <div className="space-y-3">
        <NumberInput id="weight" label="体重" value={weight} onChange={setWeight} unit="kg" />
        <NumberInput id="glucose" label="ブドウ糖濃度" value={glucose} onChange={setGlucose} unit="%" />
        <NumberInput id="rate" label="投与速度" value={rate} onChange={setRate} unit="mL/h" />
      </div>
    </CalculatorLayout>
  )
}
