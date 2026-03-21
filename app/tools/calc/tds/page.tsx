'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('tds')!
const items=[{id:'q1',label:'自分が吸うつもりより多く吸ってしまう'},{id:'q2',label:'禁煙や減煙を試みてできなかった'},{id:'q3',label:'禁煙時にタバコがほしくてたまらなくなる'},{id:'q4',label:'禁煙時にイライラ等の症状があった'},{id:'q5',label:'上の症状を消すために再喫煙した'},{id:'q6',label:'重い病気にかかっても吸った'},{id:'q7',label:'健康問題を自覚しても吸った'},{id:'q8',label:'精神的問題を自覚しても吸った'},{id:'q9',label:'タバコに依存していると感じる'},{id:'q10',label:'タバコが吸えない仕事やつきあいを避けた'}]
export default function TDSPage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const score=items.filter(i=>checks[i.id]).length
    return {score,severity:score>=5?'wn' as const:'ok' as const,label:score>=5?'ニコチン依存症（≧5）→ 禁煙外来の保険適用':'依存症に該当しない'}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="TDS" value={result.score} unit="/10" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">TDSとは</h2><p>ニコチン依存症スクリーニング。10問中5問以上で依存症。禁煙治療の保険適用要件（TDS≧5 + BI≧200）。</p></section>}
      relatedTools={[]} references={[{text:'Kawakami N et al. Addict Behav 1999;24:155-166'}]}
    ><div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}