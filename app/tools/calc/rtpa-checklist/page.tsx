'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('rtpa-checklist')!
const contraindications=[
  {id:'ich',label:'頭蓋内出血の既往'},{id:'sah',label:'くも膜下出血（疑い含む）'},
  {id:'3mo_stroke',label:'3ヶ月以内の脳梗塞（TIAは除く）'},{id:'3mo_head',label:'3ヶ月以内の重篤な頭部外傷'},
  {id:'3mo_surgery',label:'14日以内の大手術'},{id:'gi_bleed',label:'21日以内の消化管/尿路出血'},
  {id:'aortic',label:'大動脈解離（疑い含む）'},{id:'bp_sys',label:'降圧療法後も収縮期血圧>185mmHg'},
  {id:'bp_dia',label:'降圧療法後も拡張期血圧>110mmHg'},{id:'plt',label:'血小板 <100,000/μL'},
  {id:'glucose_low',label:'血糖 <50mg/dL'},{id:'pt_inr',label:'PT-INR >1.7 or APTT延長'},
  {id:'doac',label:'抗凝固薬服用中（最終内服から効果持続内）'},{id:'ie',label:'感染性心内膜炎'},
]
const cautions=[
  {id:'mild',label:'軽症（NIHSS≦5で急速改善傾向）'},{id:'age80',label:'80歳超'},{id:'onset45',label:'発症3-4.5h（慎重投与域）'},
  {id:'dm_stroke',label:'糖尿病+脳梗塞の既往の合併'},{id:'aspects_low',label:'ASPECTS <6（広範な早期虚血変化）'},
]
export default function RtPAChecklistPage(){
  const [contra,setContra]=useState<Record<string,boolean>>(Object.fromEntries(contraindications.map(c=>[c.id,false])))
  const [caution,setCaution]=useState<Record<string,boolean>>(Object.fromEntries(cautions.map(c=>[c.id,false])))
  const result=useMemo(()=>{
    const contraCount=contraindications.filter(c=>contra[c.id]).length
    const cautionCount=cautions.filter(c=>caution[c.id]).length
    if(contraCount>0) return {severity:'dn' as const,label:`適応外（${contraCount}項目該当）: rt-PA投与不可`}
    if(cautionCount>0) return {severity:'wn' as const,label:`慎重投与（${cautionCount}項目）: リスク・ベネフィットを慎重に判断`}
    return {severity:'ok' as const,label:'禁忌・慎重投与項目なし: 発症4.5h以内なら rt-PA投与を検討'}
  },[contra,caution])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="rt-PA適応判定" value={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">rt-PAチェックリストとは</h2><p>アルテプラーゼ（0.6mg/kg、最大60mg）静注血栓溶解療法の適応を判断するチェックリスト。発症4.5時間以内が対象。禁忌項目が1つでもあれば投与不可。慎重投与項目はリスク・ベネフィットを個別に判断。</p><p className="text-wn font-medium">⚠️ このチェックリストは補助的なものです。最終判断は脳卒中専門医と協議してください。</p></section>}
      relatedTools={[]} references={[{text:'日本脳卒中学会. 静注血栓溶解(rt-PA)療法 適正治療指針 第三版 2019'}]}
    >
      <div className="space-y-4">
        <div><p className="text-xs font-bold text-dn mb-2">禁忌項目（1つでも→投与不可）</p><div className="space-y-1">{contraindications.map(c=><CheckItem key={c.id} id={c.id} label={c.label} checked={contra[c.id]} onChange={v=>setContra(p=>({...p,[c.id]:v}))} />)}</div></div>
        <div><p className="text-xs font-bold text-wn mb-2">慎重投与項目</p><div className="space-y-1">{cautions.map(c=><CheckItem key={c.id} id={c.id} label={c.label} checked={caution[c.id]} onChange={v=>setCaution(p=>({...p,[c.id]:v}))} />)}</div></div>
      </div>
    </CalculatorLayout>
  )
}
