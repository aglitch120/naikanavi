'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('sarc-f')!
const items=[
  {id:'strength',label:'S: 4.5kgの荷物を持ち上げて運ぶのが困難',options:[{label:'困難なし',value:'0'},{label:'いくらか困難',value:'1'},{label:'非常に困難/不可能',value:'2'}]},
  {id:'walk',label:'A: 部屋の端から端まで歩くのが困難',options:[{label:'困難なし',value:'0'},{label:'いくらか困難',value:'1'},{label:'非常に困難/補助具使用/不可能',value:'2'}]},
  {id:'rise',label:'R: 椅子やベッドから立ち上がるのが困難',options:[{label:'困難なし',value:'0'},{label:'いくらか困難',value:'1'},{label:'非常に困難/他者の援助なしに不可能',value:'2'}]},
  {id:'climb',label:'C: 階段10段を昇るのが困難',options:[{label:'困難なし',value:'0'},{label:'いくらか困難',value:'1'},{label:'非常に困難/不可能',value:'2'}]},
  {id:'falls',label:'F: 過去1年間の転倒回数',options:[{label:'なし',value:'0'},{label:'1-3回',value:'1'},{label:'4回以上',value:'2'}]},
]
export default function SARCFPage(){
  const [vals,setVals]=useState<Record<string,string>>(Object.fromEntries(items.map(i=>[i.id,'0'])))
  const result=useMemo(()=>{
    const score=Object.values(vals).reduce((s,v)=>s+Number(v),0)
    return {score,severity:score>=4?'wn' as const:'ok' as const,label:score>=4?'サルコペニアの疑い（≧4）→ 筋力・歩行速度・筋肉量の評価へ':'サルコペニアの可能性低い（<4）'}
  },[vals])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="SARC-F" value={result.score} unit="/10点" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">SARC-Fとは</h2><p>サルコペニアのスクリーニングツール。5項目(Strength/Assistance walking/Rise from chair/Climb stairs/Falls)各0-2点の10点満点。≧4でサルコペニアの疑い→AWGS2019やEWGSOP2のフルアセスメントへ。</p></section>}
      relatedTools={[]} references={[{text:'Malmstrom TK et al. SARC-F: a symptom score to predict persons with sarcopenia at risk for poor functional outcomes. J Cachexia Sarcopenia Muscle 2016;7:28-36'}]}
    ><div className="space-y-4">{items.map(i=><RadioGroup key={i.id} id={i.id} label={i.label} options={i.options} value={vals[i.id]} onChange={v=>setVals(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}
