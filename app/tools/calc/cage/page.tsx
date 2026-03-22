'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('cage')!
const items = [
  {id:'cut',label:'C: 飲酒量を減らさなければと思ったことがあるか (Cut down)'},
  {id:'annoyed',label:'A: 周囲から飲酒を批判され腹が立ったことがあるか (Annoyed)'},
  {id:'guilty',label:'G: 飲酒について罪悪感を感じたことがあるか (Guilty)'},
  {id:'eye',label:'E: 朝起きてすぐ酒を飲んだことがあるか (Eye-opener)'},
]
export default function CAGEPage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const score=items.filter(i=>checks[i.id]).length
    if(score>=2) return {score,severity:'dn' as const,label:'陽性（2問以上）: アルコール依存症の可能性高い → 詳細評価へ'}
    if(score===1) return {score,severity:'wn' as const,label:'1問陽性: 問題飲酒の可能性 → 詳細な飲酒歴聴取を'}
    return {score,severity:'ok' as const,label:'陰性: アルコール依存症の可能性低い'}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="CAGE" value={result.score} unit="/4問" interpretation={result.label} severity={result.severity} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Ewing JA. Detecting alcoholism: The CAGE questionnaire. JAMA 1984;252:1905-1907'}]}
    >
      <div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div>
    </CalculatorLayout>
  )
}
