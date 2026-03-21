'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('naranjo')!
const items=[
  {id:'q1',label:'1. この有害事象に関する報告/論文があるか',yes:1,no:0,unknown:0},
  {id:'q2',label:'2. 疑わしい薬剤の投与後に出現したか',yes:2,no:-1,unknown:0},
  {id:'q3',label:'3. 薬剤中止/減量で改善したか',yes:1,no:0,unknown:0},
  {id:'q4',label:'4. 再投与で再発したか',yes:2,no:-1,unknown:0},
  {id:'q5',label:'5. 薬剤以外の原因が考えられるか',yes:-1,no:2,unknown:0},
  {id:'q6',label:'6. プラセボ投与時にも出現したか',yes:-1,no:1,unknown:0},
  {id:'q7',label:'7. 血中濃度が中毒域であったか',yes:1,no:0,unknown:0},
  {id:'q8',label:'8. 用量依存性があったか',yes:1,no:0,unknown:0},
  {id:'q9',label:'9. 同じ薬剤で同様の反応の既往があるか',yes:1,no:0,unknown:0},
  {id:'q10',label:'10. 客観的な検査で確認されたか',yes:1,no:0,unknown:0},
]
export default function NaranjoPage(){
  const [vals,setVals]=useState<Record<string,string>>(Object.fromEntries(items.map(i=>[i.id,'unknown'])))
  const result=useMemo(()=>{
    const score=items.reduce((s,i)=>{const v=vals[i.id];return s+(v==='yes'?i.yes:v==='no'?i.no:i.unknown)},0)
    if(score>=9) return {score,severity:'dn' as const,label:'確実(Definite): ≧9点'}
    if(score>=5) return {score,severity:'wn' as const,label:'probable: 5-8点'}
    if(score>=1) return {score,severity:'ok' as const,label:'possible: 1-4点'}
    return {score,severity:'ok' as const,label:'unlikely: ≦0点'}
  },[vals])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Naranjo" value={result.score} unit="点" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">Naranjo評価スケールとは</h2><p>薬物有害事象（ADR）と薬剤の因果関係を10項目で評価。≧9確実、5-8 probable、1-4 possible、≦0 unlikely。医薬品安全性報告や論文での標準ツール。</p></section>}
      relatedTools={[]} references={[{text:'Naranjo CA et al. A method for estimating the probability of adverse drug reactions. Clin Pharmacol Ther 1981;30:239-245'}]}
    ><div className="space-y-3">{items.map(i=><RadioGroup key={i.id} id={i.id} label={i.label} options={[{label:'はい',value:'yes'},{label:'いいえ',value:'no'},{label:'不明',value:'unknown'}]} value={vals[i.id]} onChange={v=>setVals(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}
