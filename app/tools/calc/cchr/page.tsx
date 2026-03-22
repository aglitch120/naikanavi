'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('cchr')!

const highRisk = [
  { id:'gcs2h', label:'GCSが受傷2時間後に15未満', points:1 },
  { id:'skull_fx', label:'開放性/陥没骨折の疑い', points:1 },
  { id:'skull_base', label:'頭蓋底骨折の徴候（Battle sign/パンダの目/髄液漏/鼓室出血）', points:1 },
  { id:'vomit2', label:'2回以上の嘔吐', points:1 },
  { id:'age65', label:'65歳以上', points:1 },
]
const medRisk = [
  { id:'amnesia30', label:'受傷前30分以上の逆行性健忘', points:1 },
  { id:'mechanism', label:'危険な受傷機転（歩行者vs車/車外放出/1m超からの転落）', points:1 },
]

export default function CCHRPage() {
  const [checks, setChecks] = useState<Record<string,boolean>>(
    Object.fromEntries([...highRisk,...medRisk].map(c=>[c.id,false]))
  )
  const result = useMemo(()=>{
    const h = highRisk.filter(c=>checks[c.id]).length
    const m = medRisk.filter(c=>checks[c.id]).length
    if(h>0) return { score:h+m, severity:'dn' as const, label:'高リスク: 頭部CT必須（脳外科的介入が必要な損傷リスク）' }
    if(m>0) return { score:m, severity:'wn' as const, label:'中リスク: 頭部CT検討（臨床的に重要な脳損傷リスク）' }
    return { score:0, severity:'ok' as const, label:'低リスク: CT不要（適応基準を満たさない）' }
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="CCHR判定" value={result.label} severity={result.severity} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Stiell IG et al. The Canadian CT Head Rule for patients with minor head injury. Lancet 2001;357:1391-1396'}]}
    >
      <div className="space-y-1">
        <p className="text-xs font-bold text-dn mb-2">高リスク因子（1つでも→CT必須）</p>
        {highRisk.map(c=><CheckItem key={c.id} id={c.id} label={c.label} checked={checks[c.id]} onChange={v=>setChecks(p=>({...p,[c.id]:v}))} />)}
        <p className="text-xs font-bold text-wn mb-2 mt-4">中リスク因子（1つでも→CT検討）</p>
        {medRisk.map(c=><CheckItem key={c.id} id={c.id} label={c.label} checked={checks[c.id]} onChange={v=>setChecks(p=>({...p,[c.id]:v}))} />)}
      </div>
    </CalculatorLayout>
  )
}
