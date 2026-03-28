'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('kawasaki')!
const items=[{id:'fever',label:'5日以上の発熱'},{id:'conjunctival',label:'両側眼球結膜充血（非滲出性）'},{id:'lips',label:'口唇・口腔所見（口唇紅潮/いちご舌/口腔粘膜びまん性発赤）'},{id:'rash',label:'不定形発疹'},{id:'extremity',label:'四肢末端の変化（急性期:手足の硬性浮腫・掌蹠紅斑、回復期:指先からの膜様落屑）'},{id:'cervical',label:'急性期の非化膿性頚部リンパ節腫脹（径1.5cm以上）'}]
export default function KawasakiPage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const count=items.filter(i=>checks[i.id]).length
    const hasFever=checks['fever']
    if(hasFever&&count>=5) return {count,severity:'dn' as const,label:'川崎病の可能性が高い（発熱+4/5症状）— 詳細評価は担当医が判断'}
    if(hasFever&&count===4) return {count,severity:'wn' as const,label:'不全型川崎病の可能性（発熱+3/5症状）— 詳細評価は担当医が判断'}
    if(!hasFever&&count>=4) return {count,severity:'wn' as const,label:'発熱が確認されていません — 川崎病は5日以上の発熱が必須条件です'}
    return {count,severity:'ok' as const,label:'川崎病の基準を満たさない → 他疾患の鑑別'}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="川崎病" value={result.count+'/6主要症状'} interpretation={result.label} severity={result.severity} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'日本川崎病学会. 川崎病診断の手引き 改訂第6版 2019'}]}
    ><div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}