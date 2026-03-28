'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('san-francisco-syncope')!
const items = [
  {id:'chf',label:'C: うっ血性心不全の既往'},{id:'hct',label:'H: Hct < 30%'},{id:'ecg',label:'E: 心電図異常（非洞調律 or 新規変化）'},
  {id:'sob',label:'S: 息切れの訴え'},{id:'sbp',label:'S: 収縮期血圧 < 90mmHg（トリアージ時）'},
]
export default function SFSyncopePage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const pos=items.filter(i=>checks[i.id]).length
    if(pos>0) return {severity:'wn' as const,label:`陽性（${pos}項目）: 7日以内の重大イベントリスクあり → 入院/精査検討`}
    return {severity:'ok' as const,label:'全項目陰性(CHESS): 低リスク → 外来フォロー可'}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="SFSR (CHESS)" value={result.label} severity={result.severity} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Quinn JV et al. Derivation of the San Francisco Syncope Rule. Ann Emerg Med 2004;43:224-232'},{text:'※外部検証では感度/特異度が元論文より低く、単独での使用には限界あり。臨床的判断との統合が必要（Birnbaum A, et al. Ann Emerg Med 2008）'}]}
    >
      <div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div>
    </CalculatorLayout>
  )
}
