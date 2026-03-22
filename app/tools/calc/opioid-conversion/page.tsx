'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('opioid-conversion')!
const drugs=[
  {id:'morphine-po',name:'モルヒネ経口',ratio:1},{id:'morphine-iv',name:'モルヒネ注射',ratio:3},
  {id:'oxycodone-po',name:'オキシコドン経口',ratio:1.5},{id:'oxycodone-iv',name:'オキシコドン注射',ratio:2.25},
  {id:'hydromorphone-po',name:'ヒドロモルフォン経口',ratio:5},{id:'hydromorphone-iv',name:'ヒドロモルフォン注射',ratio:20},
  {id:'fentanyl-iv',name:'フェンタニル注射(μg/h)',ratio:1},{id:'fentanyl-patch',name:'フェンタニルパッチ(μg/h)',ratio:1},
  {id:'tapentadol-po',name:'タペンタドール経口',ratio:0.3},{id:'tramadol-po',name:'トラマドール経口',ratio:0.2},
  {id:'codeine-po',name:'コデイン経口',ratio:0.15},
]
export default function OpioidConversionPage(){
  const [from,setFrom]=useState('morphine-po')
  const [dose,setDose]=useState('30')
  const result=useMemo(()=>{
    const d=Number(dose)||0;const fromDrug=drugs.find(dr=>dr.id===from)!
    const morphineEq=d*fromDrug.ratio
    const fentanylHourly=morphineEq/2
    return {morphineEq:morphineEq.toFixed(1),fentanylHourly:fentanylHourly.toFixed(1),conversions:drugs.filter(dr=>dr.id!==from).map(dr=>({name:dr.name,dose:(morphineEq/dr.ratio).toFixed(1)}))}
  },[from,dose])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="経口モルヒネ換算" value={result.morphineEq} unit="mg/日" interpretation={`フェンタニル注射換算: ${result.fentanylHourly} μg/h`} severity="ok" />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'日本緩和医療学会. がん疼痛の薬物療法に関するガイドライン 2020年版'}]}
    >
      <div className="space-y-4">
        <SelectInput id="from" label="現在の薬剤" value={from} onChange={setFrom} options={drugs.map(d=>({label:d.name,value:d.id}))} />
        <NumberInput id="dose" label="現在の1日量" value={dose} onChange={setDose} unit={from.includes('fentanyl')?'μg/h':'mg/日'} />
        {Number(dose)>0&&(<div className="bg-acl border border-ac/20 rounded-xl p-4"><p className="text-xs font-bold text-ac mb-2">換算結果</p><div className="space-y-1">{result.conversions.map(c=>(<p key={c.name} className="text-sm text-tx"><span className="font-medium">{c.name}:</span> {c.dose} {c.name.includes('fentanyl')?'μg/h':'mg/日'}</p>))}</div></div>)}
      </div>
    </CalculatorLayout>
  )
}
