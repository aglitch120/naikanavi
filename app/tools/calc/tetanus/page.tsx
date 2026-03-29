'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('tetanus')!
const woundTypes=[{label:'清潔・小さい創',value:'clean'},{label:'その他（汚染・深い・壊死組織含む）',value:'dirty'}]
const vaccineHistory=[
  {label:'不明 or 3回未満',value:'under3'},{label:'3回以上（最終接種から5年以内）',value:'recent'},{label:'3回以上（最終接種から5-10年）',value:'mid'},{label:'3回以上（最終接種から10年超）',value:'old'},
]
export default function TetanusPage(){
  const [wound,setWound]=useState('clean');const [vaccine,setVaccine]=useState('recent')
  // CDC Pink Book: 汚染創は最終接種5年超でトキソイド推奨、清潔創は10年超
  const needToxoid=(vaccine==='under3')||(wound==='dirty'&&(vaccine==='old'||vaccine==='mid'))||(wound==='clean'&&vaccine==='old')
  const needTIG=vaccine==='under3'
  const sev=needTIG?'dn' as const:needToxoid?'wn' as const:'ok' as const
  let label='トキソイド・TIG不要'
  if(needTIG) label='トキソイド・TIG — CDC基準では該当（最終判断は担当医）'
  else if(needToxoid) label='トキソイド — CDC基準では該当（最終判断は担当医）'
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="破傷風予防" value={label} severity={sev} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'CDC. Tetanus: Prevention. Pink Book 2021'},{text:'CDC. Epidemiology and Prevention of Vaccine-Preventable Diseases (Pink Book). 破傷風予防はCDC基準に準拠'}]}
    ><div className="space-y-4"><RadioGroup id="wound" label="創の性状" options={woundTypes} value={wound} onChange={setWound} /><RadioGroup id="vaccine" label="破傷風ワクチン接種歴" options={vaccineHistory} value={vaccine} onChange={setVaccine} /></div></CalculatorLayout>
  )
}
