'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('toast')!
const types=[
  {value:'laa',label:'大血管アテローム硬化性（LAA）',desc:'頸動脈/頭蓋内動脈の50%以上狭窄。抗血小板薬+CEA/CAS検討',sev:'wn' as const},
  {value:'svo',label:'小血管閉塞性（SVO/ラクナ）',desc:'径<15mm。高血圧管理が二次予防の主体。抗血小板薬',sev:'ok' as const},
  {value:'ce',label:'心原性塞栓（CE）',desc:'AF等が塞栓源。抗凝固療法（DOAC/ワルファリン）が二次予防',sev:'dn' as const},
  {value:'other',label:'その他の原因',desc:'動脈解離・血管炎・もやもや病・凝固異常等',sev:'wn' as const},
  {value:'undetermined',label:'原因不明',desc:'複数の原因候補 or 精査後も不明',sev:'wn' as const},
]
export default function TOASTPage(){
  const [type,setType]=useState('laa')
  const t=types.find(t=>t.value===type)!
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="TOAST分類" value={t.label} interpretation={t.desc} severity={t.sev} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">TOAST分類とは</h2><p>脳梗塞を5つの病型に分類。病型により二次予防戦略が異なる。大血管・心原性は抗血栓薬の選択に直結。</p></section>}
      relatedTools={[]} references={[{text:'Adams HP et al. Classification of subtype of acute ischemic stroke. Stroke 1993;24:35-41'}]}
    >
      <RadioGroup id="toast" label="脳梗塞の病型" options={types.map(t=>({label:t.label,value:t.value}))} value={type} onChange={setType} />
    </CalculatorLayout>
  )
}
