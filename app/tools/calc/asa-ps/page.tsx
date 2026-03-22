'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('asa-ps')!
const levels=[
  {label:'I: 健康な患者（併存疾患なし、非喫煙者、飲酒なし〜少量）',value:'1'},
  {label:'II: 軽度の全身疾患（喫煙者、社会的飲酒、妊婦、肥満BMI30-40、コントロール良好なDM/HT）',value:'2'},
  {label:'III: 重度の全身疾患（コントロール不良のDM/HT、COPD、BMI≧40、活動性肝炎、アルコール依存、PM/ICD、ESRD（定期透析）、60歳未満のMI/CVA/TIA/CAD歴）',value:'3'},
  {label:'IV: 生命を脅かす重度の全身疾患（最近のMI/CVA/TIA、進行中の心虚血、重症弁膜症、重症EF低下、敗血症、DIC、ARDS、ESRD(非定期透析)）',value:'4'},
  {label:'V: 手術なしでは生存が期待できない瀕死状態（破裂AAA、重症外傷、頭蓋内出血(mass effect)、腸管虚血(心血管病変併存)）',value:'5'},
  {label:'VI: 脳死と判定された臓器提供ドナー',value:'6'},
]
export default function ASAPSPage(){
  const [val,setVal]=useState('1')
  const v=Number(val);const sev=v<=2?'ok' as const:v<=3?'wn' as const:'dn' as const
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="ASA-PS" value={`Class ${val}`} interpretation={v<=2?'低リスク':v<=3?'中リスク':'高リスク'} severity={sev} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'ASA Physical Status Classification System. American Society of Anesthesiologists 2020'}]}
    >
      <RadioGroup id="asa" label="患者の全身状態" options={levels} value={val} onChange={setVal} />
    </CalculatorLayout>
  )
}
