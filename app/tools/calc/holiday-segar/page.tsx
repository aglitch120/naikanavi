'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('holiday-segar')!
export default function HolidaySegarPage(){
  const [weight,setWeight]=useState('20')
  const result=useMemo(()=>{
    const w=Number(weight)||0
    let daily=0,hourly=0
    if(w<=10){daily=w*100;hourly=w*4}
    else if(w<=20){daily=1000+(w-10)*50;hourly=40+(w-10)*2}
    else{daily=1500+(w-20)*20;hourly=60+(w-20)*1}
    return {daily:Math.round(daily),hourly:Math.round(hourly)}
  },[weight])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="維持輸液量" value={result.daily} unit={`mL/日 (${result.hourly} mL/h)`} interpretation="4-2-1ルールによる維持輸液量" severity="ok" />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Holliday MA, Segar WE. The maintenance need for water in parenteral fluid therapy. Pediatrics 1957;19:823-832'}]}
    >
      <NumberInput id="weight" label="体重" value={weight} onChange={setWeight} unit="kg" />
    </CalculatorLayout>
  )
}
