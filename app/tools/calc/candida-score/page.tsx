'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('candida-score')!
const items=[
  {id:'surgery',label:'手術（ICU入室時 or 過去2週間以内）',points:1},{id:'tpn',label:'中心静脈栄養(TPN)',points:1},
  {id:'colonization',label:'Candida の多部位コロニゼーション（≧2箇所）',points:1},{id:'sepsis',label:'重症敗血症',points:2},
]
export default function CandidaScorePage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const score=items.filter(i=>checks[i.id]).reduce((s,i)=>s+i.points,0)
    if(score>=3) return {score,severity:'dn' as const,label:'高リスク（≧3）: 侵襲性カンジダ症を疑う → 抗真菌薬開始を検討'}
    return {score,severity:'ok' as const,label:'低リスク（<3）: 侵襲性カンジダ症の可能性低い'}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Candida Score" value={result.score} unit="/5点" interpretation={result.label} severity={result.severity} />}
      explanation={
        <div className="space-y-2 text-sm text-muted">
          <div className="bg-wnl border border-wnb rounded-xl p-3">
            <p className="text-xs font-medium text-wn">適用対象について</p>
            <p className="text-xs text-wn mt-1">適用対象: 非好中球減少の重症ICU患者。好中球減少患者（ANC &lt;500/μL）は本スコアの対象外であり、別途ガイドラインに基づく評価が必要。</p>
          </div>
        </div>
      }
      relatedTools={[]} references={[{text:'León C et al. A bedside scoring system (Candida score) for early antifungal treatment in non-neutropenic critically ill patients with Candida colonization. Crit Care Med 2006;34:730-737'}]}
    ><div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={`${i.label} (+${i.points}点)`} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}
