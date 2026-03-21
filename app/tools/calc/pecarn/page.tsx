'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup, CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('pecarn')!
const u2=[{id:'gcs_alt',label:'GCSの変化/意識状態異常'},{id:'skull_fx',label:'触知可能な頭蓋骨骨折'},{id:'loc5',label:'5秒以上の意識消失'},{id:'severe_mech',label:'重度の受傷機転'},{id:'scalp_hematoma',label:'後頭部以外の頭皮血腫（2歳未満は重要サイン）'},{id:'abnormal_behavior',label:'保護者から見て普段と異なる行動'}]
const o2=[{id:'gcs_alt2',label:'GCSの変化/意識状態異常'},{id:'signs_skull',label:'頭蓋底骨折の徴候'},{id:'loc_any',label:'意識消失あり'},{id:'vomit',label:'嘔吐'},{id:'severe_mech2',label:'重度の受傷機転'},{id:'severe_headache',label:'重度の頭痛'}]
export default function PECARNPage(){
  const [age,setAge]=useState<'under2'|'over2'>('under2')
  const items=age==='under2'?u2:o2
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries([...u2,...o2].map(i=>[i.id,false])))
  const hasHigh=age==='under2'?checks.gcs_alt||checks.skull_fx:checks.gcs_alt2||checks.signs_skull
  const hasMed=items.filter(i=>!['gcs_alt','skull_fx','gcs_alt2','signs_skull'].includes(i.id)).some(i=>checks[i.id])
  const result=hasHigh?{sev:'dn' as const,label:'高リスク: 頭部CT検討（ciTBI 4.3%）'}:hasMed?{sev:'wn' as const,label:'中リスク: CT vs 経過観察を臨床判断（ciTBI <1%）。4-6h観察 or CT検討'}:{sev:'ok' as const,label:'低リスク: CT不要（ciTBI <0.02%）。帰宅指導'}
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="PECARN" value={result.label} severity={result.sev} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">PECARNとは</h2><p>GCS14-15の小児頭部外傷(0-18歳)を対象。2歳未満と2歳以上で異なる基準。ciTBI(clinically important TBI)リスクを3層に分類。42,412例の大規模研究に基づく。</p></section>}
      relatedTools={[]} references={[{text:'Kuppermann N et al. Identification of children at very low risk of clinically-important brain injuries after head trauma. Lancet 2009;374:1160-1170'}]}
    >
      <div className="space-y-4">
        <RadioGroup id="age" label="年齢群" options={[{label:'2歳未満',value:'under2'},{label:'2歳以上',value:'over2'}]} value={age} onChange={v=>{setAge(v as any);setChecks(Object.fromEntries([...u2,...o2].map(i=>[i.id,false])))}} />
        <div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div>
      </div>
    </CalculatorLayout>
  )
}
