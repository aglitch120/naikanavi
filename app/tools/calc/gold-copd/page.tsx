'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('gold-copd')!
const spirometry=[
  {label:'GOLD 1 (軽度): FEV1 ≧80%predicted',value:'1'},{label:'GOLD 2 (中等度): 50% ≦ FEV1 < 80%',value:'2'},
  {label:'GOLD 3 (重度): 30% ≦ FEV1 < 50%',value:'3'},{label:'GOLD 4 (最重度): FEV1 < 30%',value:'4'},
]
const abcd=[
  {label:'A群: 増悪少(0-1回/年,入院なし) + 症状少(mMRC 0-1/CAT<10)',value:'A'},
  {label:'B群: 増悪少(0-1回/年,入院なし) + 症状多(mMRC≧2/CAT≧10)',value:'B'},
  {label:'E群: 増悪多(≧2回/年 or ≧1回入院)',value:'E'},
]
export default function GOLDCOPDPage(){
  const [spiro,setSpiro]=useState('2');const [group,setGroup]=useState('A')
  const sev=spiro==='1'?'ok' as const:spiro==='2'?'wn' as const:'dn' as const
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="GOLD分類" value={`GOLD ${spiro} / ${group}群`} interpretation={group==='A'?'LAMA or LABA単剤':group==='B'?'LAMA+LABA併用':'LAMA+LABA±ICS（好酸球≧300ならICS追加）'} severity={sev} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">GOLD COPD分類とは</h2><p>GOLD 2024では気流制限(FEV1%)によるGrade 1-4 + 症状/増悪頻度によるABE群分類の2軸で評価。E群（旧C/D群を統合）は増悪頻度が高いグループ。</p></section>}
      relatedTools={[]} references={[{text:'GOLD 2024 Report. Global Initiative for Chronic Obstructive Lung Disease'}]}
    ><div className="space-y-4"><RadioGroup id="spiro" label="気流制限（スパイロメトリー）" options={spirometry} value={spiro} onChange={setSpiro} /><RadioGroup id="group" label="ABE群（症状+増悪頻度）" options={abcd} value={group} onChange={setGroup} /></div></CalculatorLayout>
  )
}
