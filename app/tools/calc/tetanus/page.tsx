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
  const needToxoid=(vaccine==='under3')||(wound==='dirty'&&vaccine==='old')||(wound==='clean'&&vaccine==='old')
  const needTIG=wound==='dirty'&&vaccine==='under3'
  const sev=needTIG?'dn' as const:needToxoid?'wn' as const:'ok' as const
  let label='トキソイド・TIG不要'
  if(needTIG) label='トキソイド + TIG（抗破傷風ヒト免疫グロブリン250U筋注）を投与'
  else if(needToxoid) label='破傷風トキソイド（0.5mL筋注）を投与'
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="破傷風予防" value={label} severity={sev} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">外傷時の破傷風予防</h2><p>ワクチン歴（DPT/DT/Tdの接種回数と最終接種時期）と創の性状で判断。接種回数不明 or 3回未満の汚染創にはトキソイド + TIGの両方が必要。日本では1968年以降の定期接種世代はDPT3回+DT1回接種済みの場合が多い。</p></section>}
      relatedTools={[]} references={[{text:'CDC. Tetanus: Prevention. Pink Book 2021'},{text:'日本外科感染症学会. 術後感染予防抗菌薬適正使用のためのガイドライン'}]}
    ><div className="space-y-4"><RadioGroup id="wound" label="創の性状" options={woundTypes} value={wound} onChange={setWound} /><RadioGroup id="vaccine" label="破傷風ワクチン接種歴" options={vaccineHistory} value={vaccine} onChange={setVaccine} /></div></CalculatorLayout>
  )
}
