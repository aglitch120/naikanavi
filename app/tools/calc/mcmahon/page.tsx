'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('mcmahon')!
const items=[
  {id:'age',label:'年齢 > 70歳',points:2},{id:'female',label:'女性',points:2},
  {id:'cr_init',label:'初診時Cr > 1.4mg/dL',points:2},{id:'ck',label:'初診時CK > 40,000 U/L',points:2},
  {id:'phosphate',label:'初診時リン > 5.4 mg/dL',points:2},{id:'calcium',label:'初診時Ca < 7.5 mg/dL',points:2},
  {id:'cause',label:'原因: 筋炎 or NMS or 運動',points:-3},
]
export default function McMahonPage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const score=items.filter(i=>checks[i.id]).reduce((s,i)=>s+i.points,0)
    if(score>=6) return {score,severity:'dn' as const,label:'高リスク（≧6）: 死亡 or 腎不全→透析の確率高い → 積極的輸液+ICU'}
    return {score,severity:'ok' as const,label:`低リスク（<6）: 輸液で管理。スコア${score}点`}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="McMahon" value={result.score} unit="点" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">McMahonスコアとは</h2><p>横紋筋融解症の腎不全・死亡リスク予測。≧6で高リスク。運動/筋炎/NMS原因は-3点（予後良好な傾向）。積極的輸液（200-300mL/h）と電解質管理が治療の要。</p></section>}
      relatedTools={[]} references={[{text:'McMahon GM et al. A risk prediction score for kidney failure or mortality in rhabdomyolysis. JAMA Intern Med 2013;173:1821-1828'}]}
    ><div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={`${i.label} (${i.points>0?'+':''}${i.points}点)`} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}
