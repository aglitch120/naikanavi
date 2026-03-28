'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('gustilo')!
// 抗菌薬は参考情報。現行ガイドライン(EAST等)ではβ-ラクタム系が中心、アミノグリコシドは非推奨傾向
const types=[{label:'Type I: 創<1cm、清潔',value:'I',abx:'抗菌薬・術式は担当医が判断',sev:'ok' as const},{label:'Type II: 創1-10cm、中等度損傷',value:'II',abx:'抗菌薬・術式は担当医が判断',sev:'wn' as const},{label:'Type IIIA: 創>10cm、骨が被覆可能',value:'IIIA',abx:'抗菌薬・術式は担当医が判断',sev:'wn' as const},{label:'Type IIIB: 広範欠損、皮弁必要',value:'IIIB',abx:'抗菌薬・術式は担当医が判断',sev:'dn' as const},{label:'Type IIIC: 動脈損傷合併',value:'IIIC',abx:'抗菌薬・術式は担当医が判断',sev:'dn' as const}]
export default function GustiloPage(){
  const [type,setType]=useState('I')
  const t=types.find(t=>t.value===type)!
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Gustilo-Anderson" value={'Type '+type} interpretation={'抗菌薬: '+t.abx} severity={t.sev} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Gustilo RB, Anderson JT. J Bone Joint Surg Am 1976;58:453-458'}]}
    ><RadioGroup id="gustilo" label="分類" options={types.map(t=>({'label':t.label,'value':t.value}))} value={type} onChange={setType} /></CalculatorLayout>
  )
}