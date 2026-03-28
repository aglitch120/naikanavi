'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('lrinec')!
const items = [
  { id:'crp', label:'CRP (mg/dL)', options:[{label:'<15',value:0},{label:'≧15',value:4}] },
  { id:'wbc', label:'WBC (×10³/μL)', options:[{label:'<15',value:0},{label:'15-25',value:1},{label:'>25',value:2}] },
  { id:'hb', label:'Hb (g/dL)', options:[{label:'>13.5',value:0},{label:'11-13.5',value:1},{label:'<11',value:2}] },
  { id:'na', label:'Na (mEq/L)', options:[{label:'≧135',value:0},{label:'<135',value:2}] },
  { id:'cr', label:'Cr (mg/dL)', options:[{label:'≦1.6',value:0},{label:'>1.6',value:2}] },
  { id:'glu', label:'血糖 (mg/dL)', options:[{label:'≦180',value:0},{label:'>180',value:1}] },
]
export default function LRINECPage(){
  const [vals,setVals]=useState<Record<string,number>>(Object.fromEntries(items.map(i=>[i.id,0])))
  const result=useMemo(()=>{
    const score=Object.values(vals).reduce((a,b)=>a+b,0)
    if(score>=8) return {score,severity:'dn' as const,label:'高リスク（≧8）: 壊死性筋膜炎の可能性高い → 外科コンサルト'}
    if(score>=6) return {score,severity:'wn' as const,label:'中リスク（6-7）: 壊死性筋膜炎を疑う → CT/MRI + 外科コンサルト'}
    return {score,severity:'ok' as const,label:'低スコアだがLRINECの感度は約50-70%。臨床的に疑わしければ除外しないこと'}
  },[vals])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="LRINEC" value={result.score} unit="/13点" interpretation={result.label} severity={result.severity} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Wong CH et al. The LRINEC Score: A Tool for Distinguishing Necrotizing Fasciitis from Other Soft Tissue Infections. Crit Care Med 2004'}]}
    >
      <div className="space-y-4">{items.map(i=><RadioGroup key={i.id} id={i.id} label={i.label} options={i.options.map(o=>({label:o.label,value:String(o.value)}))} value={String(vals[i.id])} onChange={v=>setVals(p=>({...p,[i.id]:Number(v)}))} />)}</div>
    </CalculatorLayout>
  )
}
