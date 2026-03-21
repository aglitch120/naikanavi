'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('siadh')!
const items=[{id:'hyponatremia',label:'血漿Na <135 mEq/L + 血漿浸透圧 <280 mOsm/kg（低張性低Na血症）'},{id:'urine_conc',label:'尿浸透圧 > 100 mOsm/kg（不適切な尿濃縮）'},{id:'urine_na',label:'尿中Na > 20-30 mEq/L（正常食塩摂取下）'},{id:'euvolemic',label:'臨床的に体液量正常（浮腫なし・脱水なし）'},{id:'exclude',label:'除外: 甲状腺機能低下症、副腎不全、利尿薬使用'}]
export default function Page(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const count=useMemo(()=>items.filter(i=>checks[i.id]).length,[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="SIADH診断基準" value={count+'/'+items.length+'項目'} interpretation={count>=Math.ceil(items.length/2)?'基準を満たす可能性あり':'基準を満たさない'} severity={count>=Math.ceil(items.length/2)?'wn' as const:'ok' as const} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">SIADH診断基準とは</h2><p>原疾患の治療 + 水制限（800-1000mL/日）が第一選択。重症（Na{'<'}120 or 症候性）→ 3%NaCl 100-150mL iv。補正速度: 24hで8mEq/L以内（ODS予防）。</p></section>}
      relatedTools={[]} references={[{text:'バソプレシン分泌過剰症の診断基準'}]}
    ><div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))}/>)}</div></CalculatorLayout>
  )
}