'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('la-classification')!
const items=[{id:'n',label:'Grade N: 正常（粘膜障害なし）'},{id:'m',label:'Grade M: 微小変化（発赤のみ、びらんなし）'},{id:'a',label:'Grade A: 粘膜障害が5mm以下で粘膜ヒダに限局'},{id:'b',label:'Grade B: 粘膜障害が5mm超だが粘膜ヒダ間に連続しない'},{id:'c',label:'Grade C: 粘膜障害が粘膜ヒダ間に連続するが全周の75%未満'},{id:'d',label:'Grade D: 粘膜障害が全周の75%以上'}]
export default function Page(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const count=useMemo(()=>items.filter(i=>checks[i.id]).length,[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="逆流性食道炎 改訂LA分類" value={count+'/'+items.length+'項目'} interpretation={count>=Math.ceil(items.length/2)?'基準を満たす可能性あり':'基準を満たさない'} severity={count>=Math.ceil(items.length/2)?'wn' as const:'ok' as const} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'逆流性食道炎の内視鏡所見分類'}]}
    ><div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))}/>)}</div></CalculatorLayout>
  )
}