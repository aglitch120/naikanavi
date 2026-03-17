'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('bishop')!
const items=[{id:'dilation',label:'子宮口開大: 0cm(0)/1-2cm(1)/3-4cm(2)/≧5cm(3)'},{id:'effacement',label:'展退度: 0-30%(0)/40-50%(1)/60-70%(2)/≧80%(3)'},{id:'station',label:'児頭下降度: -3(0)/-2(1)/-1,0(2)/+1,+2(3)'},{id:'consistency',label:'頚管の硬さ: 硬(0)/中(1)/軟(2)'},{id:'position',label:'頚管の位置: 後方(0)/中間(1)/前方(2)'}]
export default function Page(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const count=useMemo(()=>items.filter(i=>checks[i.id]).length,[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Bishopスコア" value={count+'/'+items.length+'項目'} interpretation={count>=Math.ceil(items.length/2)?'基準を満たす可能性あり':'基準を満たさない'} severity={count>=Math.ceil(items.length/2)?'wn' as const:'ok' as const} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">Bishopスコアとは</h2><p>≧9で誘発分娩成功率高い。≦5で頚管未熟→プロスタグランジン等で頚管熟化が必要なことが多い。</p></section>}
      relatedTools={[]} references={[{text:'子宮頚管成熟度の内診評価'}]}
    ><div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))}//>)}</div></CalculatorLayout>
  )
}