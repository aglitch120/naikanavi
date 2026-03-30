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
    // 高K: TTKG>7=腎排泄適切(ok), ≤7=腎排泄不十分=腎性(dn)
    // 低K: TTKG<3=腎排泄適切=腎外性喪失(ok), TTKG≥3=腎排泄過多=腎性喪失(dn)
    // 高K: TTKG>7=腎排泄適切, ≤7=腎排泄不十分 / 低K: TTKG<3=腎外性, ≥3=腎性
    const isHyperK = sk > 5.0
    const isHypoK = sk < 3.5
    const isNormalK = !isHyperK && !isHypoK
    const sev = isNormalK ? 'ok' as const : isHyperK ? (ttkg > 7 ? 'ok' as const : 'dn' as const) : (ttkg < 3 ? 'ok' as const : 'dn' as const)
    let label=''
    if(isNormalK) label='血清K正常範囲（3.5-5.0 mEq/L）。TTKGは高K血症・低K血症の鑑別に用いる指標'
    else if(isHyperK) label=ttkg>7?'TTKG>7: 腎からのK排泄は適切（腎外性の原因が示唆される）':'TTKG≦7: 腎からのK排泄が不十分（腎性の高K血症が示唆される）'
    else label=ttkg<3?'TTKG<3: 腎からのK排泄は適切（腎外性K喪失：消化管・皮膚等が示唆される）':'TTKG≧3: 腎からのK排泄が過多（腎性K喪失：アルドステロン症・利尿薬等が示唆される）'
    return {ttkg:ttkg.toFixed(1),severity:sev,label}
  },[uK,sK,uOsm,sOsm])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={
        <div className="space-y-3">
          <ResultCard label="TTKG" value={result.ttkg} interpretation={result.label} severity={result.severity} />
          <div className="bg-dnl border border-dnb rounded-xl p-3 space-y-1">
            <p className="text-xs font-bold text-dn">⚠ TTKGの信頼性に関する重要な注意</p>
            <p className="text-xs text-dn">TTKGの前提（髄質集合管で溶質の再吸収がない）は、現在では髄質集合管で大量の尿素が再吸収されることが判明し成立しないことが明らかになっています。TTKG提唱者のHalperin自身も使用を推奨していません。結果の解釈には十分注意し、尿K/Cr比や24時間蓄尿Kなど他の指標も併用してください。</p>
          </div>
        </div>
      }
      explanation={undefined}
      relatedTools={[]} references={[
        {text:'Ethier JH et al. The transtubular potassium concentration in patients with hypokalemia and hyperkalemia. Am J Kidney Dis 1990;15:309-315'},
        {text:'Kamel KS et al. Interpreting the urine electrolytes and osmolality in the pathophysiology of hypokalemia. Am J Kidney Dis 2014;64:489-495'},
      ]}
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
