'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('abpc-score')!
const items=[
  {id:'age60',label:'60歳未満'},{id:'no_comorbid',label:'基礎疾患がない or 軽微'},{id:'stubborn_cough',label:'頑固な咳嗽'},
  {id:'poor_chest',label:'胸部聴診所見が乏しい'},{id:'no_sputum',label:'痰がない or 迅速診断陰性'},{id:'wbc_low',label:'末梢血WBC 10,000/μL未満'},
]
export default function AbpcScorePage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const count=items.filter(i=>checks[i.id]).length
    if(count>=4) return {count,severity:'wn' as const,label:`${count}/6項目: 非定型肺炎の可能性高い → マクロライド系 or キノロン系`}
    return {count,severity:'ok' as const,label:`${count}/6項目: 細菌性肺炎の可能性高い → βラクタム系`}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="非定型肺炎スコア" value={`${result.count}/6項目`} interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">非定型肺炎スコアとは</h2><p>日本呼吸器学会の市中肺炎診療ガイドラインでが一般的。6項目中4項目以上で非定型肺炎（マイコプラズマ等）を疑い、マクロライド系を選択。3項目以下は細菌性肺炎としてβラクタム系。感度78%、特異度93%。</p></section>}
      relatedTools={[]} references={[{text:'日本呼吸器学会. 成人市中肺炎診療ガイドライン 2024'}]}
    ><div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}
