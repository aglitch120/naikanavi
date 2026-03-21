'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('gustilo')!
const types=[{label:'Type I: 創<1cm、清潔',value:'I',abx:'CEZ 24h',sev:'ok' as const},{label:'Type II: 創1-10cm、中等度損傷',value:'II',abx:'CEZ 24-48h',sev:'wn' as const},{label:'Type IIIA: 創>10cm、骨が被覆可能',value:'IIIA',abx:'CEZ+GM 72h',sev:'wn' as const},{label:'Type IIIB: 広範欠損、皮弁必要',value:'IIIB',abx:'CEZ+GM+PCG',sev:'dn' as const},{label:'Type IIIC: 動脈損傷合併',value:'IIIC',abx:'CEZ+GM+PCG 緊急',sev:'dn' as const}]
export default function GustiloPage(){
  const [type,setType]=useState('I')
  const t=types.find(t=>t.value===type)!
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Gustilo-Anderson" value={'Type '+type} interpretation={'抗菌薬: '+t.abx} severity={t.sev} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">Gustilo-Anderson分類とは</h2><p>開放骨折の重症度分類。Type I-IIIC。6-8h以内のデブリドマンが重要。破傷風予防も併せて。</p></section>}
      relatedTools={[]} references={[{text:'Gustilo RB, Anderson JT. J Bone Joint Surg Am 1976;58:453-458'}]}
    ><RadioGroup id="gustilo" label="分類" options={types.map(t=>({'label':t.label,'value':t.value}))} value={type} onChange={setType} /></CalculatorLayout>
  )
}