'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('mmrc')!
const grades=[
  {label:'Grade 0: 激しい運動時のみ息切れ',value:'0'},{label:'Grade 1: 平地を急ぎ足 or 緩やかな坂を歩くときに息切れ',value:'1'},
  {label:'Grade 2: 息切れのために同年齢の人より平地を歩くのが遅い、or 平地で自分のペースで歩いていても息切れのため立ち止まる',value:'2'},
  {label:'Grade 3: 平地を約100m or 数分歩くと息切れのため立ち止まる',value:'3'},
  {label:'Grade 4: 息切れがひどくて外出できない or 着替えで息切れ',value:'4'},
]
export default function MMRCPage(){
  const [val,setVal]=useState('0')
  const v=Number(val);const sev=v<=1?'ok' as const:v<=2?'wn' as const:'dn' as const
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="mMRC" value={`Grade ${val}`} interpretation={v<=1?'軽度の息切れ':v<=2?'中等度':v<=3?'高度':'最重度'} severity={sev} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">修正MRC息切れスケールとは</h2><p>呼吸困難の程度を5段階(Grade 0-4)で評価。COPDのGOLD分類でABCD群の判定に使用（mMRC≧2でB/D群）。リハビリの目標設定にも。</p></section>}
      relatedTools={[]} references={[{text:'Bestall JC et al. Usefulness of the Medical Research Council (MRC) dyspnoea scale. Thorax 1999;54:581-586'}]}
    ><RadioGroup id="mmrc" label="息切れの程度" options={grades} value={val} onChange={setVal} /></CalculatorLayout>
  )
}
