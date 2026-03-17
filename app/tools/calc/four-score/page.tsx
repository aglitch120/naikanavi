'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('four-score')!
const domains=[
  {id:'eye',label:'眼反応 (E)',options:[{label:'E4: 開眼・追視あり',value:'4'},{label:'E3: 開眼するが追視なし',value:'3'},{label:'E2: 疼痛で閉眼',value:'2'},{label:'E1: 疼痛で閉眼せず',value:'1'},{label:'E0: 眼反応なし（myoclonus status含む）',value:'0'}]},
  {id:'motor',label:'運動反応 (M)',options:[{label:'M4: 従命（thumbs up/fist/peace sign）',value:'4'},{label:'M3: 疼痛で手を払う',value:'3'},{label:'M2: 疼痛で屈曲反応',value:'2'},{label:'M1: 疼痛で伸展反応',value:'1'},{label:'M0: 運動反応なし or 全身myoclonus',value:'0'}]},
  {id:'brainstem',label:'脳幹反射 (B)',options:[{label:'B4: 瞳孔反射・角膜反射ともに正常',value:'4'},{label:'B3: 片側瞳孔散大固定',value:'3'},{label:'B2: 瞳孔反射 or 角膜反射のいずれか消失',value:'2'},{label:'B1: 瞳孔反射・角膜反射ともに消失',value:'1'},{label:'B0: 瞳孔反射・角膜反射・咳嗽反射すべて消失',value:'0'}]},
  {id:'resp',label:'呼吸パターン (R)',options:[{label:'R4: 非挿管、規則的呼吸',value:'4'},{label:'R3: 非挿管、Cheyne-Stokes呼吸',value:'3'},{label:'R2: 非挿管、不規則呼吸',value:'2'},{label:'R1: 人工呼吸器で設定以上の呼吸あり',value:'1'},{label:'R0: 人工呼吸器の設定のみ or 無呼吸',value:'0'}]},
]
export default function FOURScorePage(){
  const [vals,setVals]=useState<Record<string,string>>({eye:'4',motor:'4',brainstem:'4',resp:'4'})
  const result=useMemo(()=>{
    const score=Object.values(vals).reduce((s,v)=>s+Number(v),0)
    const sev=score>=13?'ok' as const:score>=9?'wn' as const:'dn' as const
    const label=score===0?'全項目0: 脳死の可能性 → 脳死判定プロトコルを検討':score<=4?'重度意識障害':score<=8?'中等度意識障害':score<=12?'軽度意識障害':'ほぼ正常'
    return {score,severity:sev,label}
  },[vals])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="FOUR Score" value={result.score} unit="/16点" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">FOURスコアとは</h2><p>Full Outline of UnResponsiveness。GCSの代替として開発。挿管患者でも評価可能（言語項目なし）。脳幹反射・呼吸パターンを含み、GCSより詳細な神経学的情報を提供。全項目0で脳死の可能性。</p></section>}
      relatedTools={[]} references={[{text:'Wijdicks EF et al. Validation of a new coma scale: The FOUR score. Ann Neurol 2005;58:585-593'}]}
    >
      <div className="space-y-4">{domains.map(d=><RadioGroup key={d.id} id={d.id} label={d.label} options={d.options} value={vals[d.id]} onChange={v=>setVals(p=>({...p,[d.id]:v}))} />)}</div>
    </CalculatorLayout>
  )
}
