'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('conut')!
const items=[
  {id:'alb',label:'アルブミン (g/dL)',options:[{label:'≧3.5',value:'0'},{label:'3.0-3.49',value:'2'},{label:'2.5-2.99',value:'4'},{label:'<2.5',value:'6'}]},
  {id:'lymph',label:'リンパ球数 (/μL)',options:[{label:'≧1600',value:'0'},{label:'1200-1599',value:'1'},{label:'800-1199',value:'2'},{label:'<800',value:'3'}]},
  {id:'chol',label:'総コレステロール (mg/dL)',options:[{label:'≧180',value:'0'},{label:'140-179',value:'1'},{label:'100-139',value:'2'},{label:'<100',value:'3'}]},
]
export default function CONUTPage(){
  const [vals,setVals]=useState<Record<string,string>>(Object.fromEntries(items.map(i=>[i.id,'0'])))
  const result=useMemo(()=>{
    const score=Object.values(vals).reduce((s,v)=>s+Number(v),0)
    if(score<=1) return {score,severity:'ok' as const,label:'正常（0-1）'}
    if(score<=4) return {score,severity:'wn' as const,label:'軽度栄養不良（2-4）'}
    if(score<=8) return {score,severity:'wn' as const,label:'中等度栄養不良（5-8）'}
    return {score,severity:'dn' as const,label:'重度栄養不良（9-12）'}
  },[vals])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="CONUT" value={result.score} unit="/12点" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">CONUTスコアとは</h2><p>Controlling Nutritional Status。アルブミン/リンパ球数/総コレステロールの3項目で栄養状態を評価。0-12点。採血データのみで自動算出可能な簡便さが利点。</p></section>}
      relatedTools={[]} references={[{text:'Ignacio de Ulíbarri J et al. CONUT: a tool for controlling nutritional status. Clin Nutr 2005;24:848-855'}]}
    >
      <div className="space-y-4">{items.map(i=><RadioGroup key={i.id} id={i.id} label={i.label} options={i.options} value={vals[i.id]} onChange={v=>setVals(p=>({...p,[i.id]:v}))} />)}</div>
    </CalculatorLayout>
  )
}
