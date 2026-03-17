'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('nexus')!
const items = [
  {id:'midline',label:'頚椎正中の圧痛'},{id:'focal',label:'局所神経脱落'},{id:'alert',label:'意識レベル低下'},
  {id:'intox',label:'中毒（アルコール/薬物）'},{id:'distract',label:'注意をそらす他の疼痛（四肢骨折等）'},
]
export default function NEXUSPage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const pos=items.filter(i=>checks[i.id]).length
    if(pos>0) return {severity:'wn' as const,label:`${pos}項目陽性: 頚椎画像検査が必要`}
    return {severity:'ok' as const,label:'全5項目陰性: 頚椎画像不要（感度99.6%）'}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="NEXUS" value={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">NEXUS基準とは</h2><p>5項目すべて陰性なら頚椎損傷の確率が極めて低く、画像検査なしに頚椎を除外できる。感度99.6%、NPV 99.9%。Canadian C-Spine Ruleと併用されることが多い。</p></section>}
      relatedTools={[]} references={[{text:'Hoffman JR et al. Validity of a set of clinical criteria to rule out injury to the cervical spine in patients with blunt trauma. NEJM 2000;343:94-99'}]}
    >
      <div className="space-y-2"><p className="text-xs text-muted mb-2">以下が1つでもあれば頚椎画像が必要:</p>{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div>
    </CalculatorLayout>
  )
}
