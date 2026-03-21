'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('borg-scale')!
const levels=[{label:'0: 何も感じない',value:'0'},{label:'0.5: 非常に弱い',value:'0.5'},{label:'1: やや弱い',value:'1'},{label:'2: 弱い',value:'2'},{label:'3: 中程度',value:'3'},{label:'4: やや強い',value:'4'},{label:'5: 強い',value:'5'},{label:'7: 非常に強い',value:'7'},{label:'10: 最大',value:'10'}]
export default function BorgPage(){
  const [val,setVal]=useState('0')
  const v=Number(val);const sev=v<=3?'ok' as const:v<=6?'wn' as const:'dn' as const
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="修正Borg" value={val} unit="/10" interpretation={v<=3?'軽度':v<=6?'中等度':'高度'} severity={sev} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">修正ボルグスケールとは</h2><p>主観的な息切れ・疲労感を0-10で評価。リハビリの運動処方（Borg 3-4目標）や6分間歩行試験に使用。</p></section>}
      relatedTools={[]} references={[{text:'Borg GA. Med Sci Sports Exerc 1982;14:377-381'}]}
    ><RadioGroup id="borg" label="息切れの程度" options={levels} value={val} onChange={setVal} /></CalculatorLayout>
  )
}