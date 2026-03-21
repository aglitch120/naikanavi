'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('eat10')!
const items=[
  {id:'q1',label:'1. 飲み込みの問題のせいで体重が減った'},{id:'q2',label:'2. 飲み込みの問題のせいで外食できない'},
  {id:'q3',label:'3. 液体を飲み込むのに余分な努力が必要'},{id:'q4',label:'4. 固形物を飲み込むのに余分な努力が必要'},
  {id:'q5',label:'5. 錠剤を飲み込むのに余分な努力が必要'},{id:'q6',label:'6. 飲み込むのが辛い'},
  {id:'q7',label:'7. 食べる楽しみが飲み込みのせいで減った'},{id:'q8',label:'8. 飲み込むと食べ物がのどに引っかかる'},
  {id:'q9',label:'9. 食べると咳が出る'},{id:'q10',label:'10. 飲み込むのがストレスだ'},
]
const opts=[{label:'0: 問題なし',value:'0'},{label:'1',value:'1'},{label:'2',value:'2'},{label:'3',value:'3'},{label:'4: 強い問題',value:'4'}]
export default function EAT10Page(){
  const [vals,setVals]=useState<Record<string,string>>(Object.fromEntries(items.map(i=>[i.id,'0'])))
  const result=useMemo(()=>{
    const score=Object.values(vals).reduce((s,v)=>s+Number(v),0)
    return {score,severity:score>=3?'wn' as const:'ok' as const,label:score>=3?'嚥下障害の疑い（≧3）→ 嚥下機能の精査・STコンサルト':'嚥下機能問題なし（<3）'}
  },[vals])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="EAT-10" value={result.score} unit="/40点" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">EAT-10とは</h2><p>Eating Assessment Tool。嚥下障害の自己記入式スクリーニング。10問各0-4点の40点満点。≧3で嚥下障害の疑い。簡便で再現性が高い。</p></section>}
      relatedTools={[]} references={[{text:'Belafsky PC et al. Validity and reliability of the Eating Assessment Tool (EAT-10). Ann Otol Rhinol Laryngol 2008;117:919-924'}]}
    ><div className="space-y-4">{items.map(i=><RadioGroup key={i.id} id={i.id} label={i.label} options={opts} value={vals[i.id]} onChange={v=>setVals(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}
