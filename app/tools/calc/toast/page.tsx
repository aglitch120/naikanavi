'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('toast')!
const types=[
  {value:'laa',label:'大血管アテローム硬化性（LAA）',desc:'頸動脈/頭蓋内動脈の50%以上狭窄。抗血小板薬+CEA/CAS検討（参考。治療選択は脳卒中専門医が判断）',sev:'wn' as const},
  {value:'svo',label:'小血管閉塞性（SVO/ラクナ）',desc:'径<15mm + ラクナ症候（純粋運動性片麻痺等）の典型的臨床症候が必要。高血圧管理が二次予防の主体。抗血小板薬（参考。治療選択は脳卒中専門医が判断）',sev:'ok' as const},
  {value:'ce',label:'心原性塞栓（CE）',desc:'AF等が塞栓源。抗凝固療法（DOAC/ワルファリン）が二次予防（参考。治療選択は脳卒中専門医が判断）',sev:'dn' as const},
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
      explanation={undefined}
      relatedTools={[]} references={[{text:'Adams HP et al. Classification of subtype of acute ischemic stroke. Stroke 1993;24:35-41'}]}
    >
      <RadioGroup id="toast" label="脳梗塞の病型" options={types.map(t=>({label:t.label,value:t.value}))} value={type} onChange={setType} />
    </CalculatorLayout>
  )
}
