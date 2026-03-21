'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('ttkg')!
export default function TTKGPage(){
  const [uK,setUK]=useState('40')
  const [sK,setSK]=useState('5')
  const [uOsm,setUOsm]=useState('500')
  const [sOsm,setSOsm]=useState('290')
  const result=useMemo(()=>{
    const uk=Number(uK)||0;const sk=Number(sK)||1;const uo=Number(uOsm)||1;const so=Number(sOsm)||1
    const ttkg=(uk/(uo/so))/sk
    const sev=ttkg>7?'ok' as const:ttkg>4?'wn' as const:'wn' as const
    let label=''
    if(sk>5.0) label=ttkg>7?'TTKG>7: 腎からのK排泄は適切（腎外性の原因を検索）':'TTKG≦7: 腎からのK排泄が不十分（腎性の高K血症）'
    else label=ttkg<3?'TTKG<3: 腎からのK排泄が過多（腎性K喪失）':'TTKG≧3: 腎からのK排泄は適切（腎外性の低K血症）'
    return {ttkg:ttkg.toFixed(1),severity:sev,label}
  },[uK,sK,uOsm,sOsm])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="TTKG" value={result.ttkg} interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">TTKGとは</h2><p>Transtubular Potassium Gradient。皮質集合管でのK分泌を反映。TTKG = (尿K ÷ (尿Osm/血漿Osm)) ÷ 血漿K。高K血症でTTKG&lt;7→腎性K排泄低下（アルドステロン不足等）。低K血症でTTKG&gt;3→腎性K喪失。</p><p className="text-wn font-medium">⚠️ 尿浸透圧が血漿浸透圧より高いことが前提条件（尿Osm &gt; 血漿Osm）。</p></section>}
      relatedTools={[]} references={[{text:'Ethier JH et al. The transtubular potassium concentration in patients with hypokalemia and hyperkalemia. Am J Kidney Dis 1990;15:309-315'}]}
    >
      <div className="space-y-3">
        <NumberInput id="uK" label="尿中K" value={uK} onChange={setUK} unit="mEq/L" />
        <NumberInput id="sK" label="血清K" value={sK} onChange={setSK} unit="mEq/L" />
        <NumberInput id="uOsm" label="尿浸透圧" value={uOsm} onChange={setUOsm} unit="mOsm/kg" />
        <NumberInput id="sOsm" label="血漿浸透圧" value={sOsm} onChange={setSOsm} unit="mOsm/kg" />
      </div>
    </CalculatorLayout>
  )
}
