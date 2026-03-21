'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('ciwa-ar')!
const items=[
  {id:'nausea',label:'悪心・嘔吐',options:[{label:'なし',value:'0'},{label:'軽度の悪心',value:'1'},{label:'間欠的な悪心',value:'4'},{label:'持続的な悪心・嘔吐',value:'7'}]},
  {id:'tremor',label:'振戦',options:[{label:'なし',value:'0'},{label:'軽度（見えないが感じる）',value:'1'},{label:'中等度（手を伸ばすと明らか）',value:'4'},{label:'重度（手を伸ばさなくても明らか）',value:'7'}]},
  {id:'sweat',label:'発汗',options:[{label:'なし',value:'0'},{label:'手掌にわずかに湿潤',value:'1'},{label:'明らかな発汗',value:'4'},{label:'大量の発汗',value:'7'}]},
  {id:'anxiety',label:'不安',options:[{label:'なし',value:'0'},{label:'軽度の不安',value:'1'},{label:'中等度の不安・警戒',value:'4'},{label:'パニック発作に相当',value:'7'}]},
  {id:'agitation',label:'精神運動興奮',options:[{label:'正常',value:'0'},{label:'やや落ち着かない',value:'1'},{label:'明らかに落ち着かない',value:'4'},{label:'歩き回る・拘束が必要',value:'7'}]},
  {id:'tactile',label:'触覚障害（かゆみ/虫が這う感覚等）',options:[{label:'なし',value:'0'},{label:'軽度',value:'1'},{label:'中等度',value:'3'},{label:'幻触',value:'5'}]},
  {id:'auditory',label:'聴覚障害',options:[{label:'なし',value:'0'},{label:'軽度',value:'1'},{label:'中等度',value:'3'},{label:'幻聴',value:'5'}]},
  {id:'visual',label:'視覚障害',options:[{label:'なし',value:'0'},{label:'軽度の光過敏',value:'1'},{label:'中等度',value:'3'},{label:'幻視',value:'5'}]},
  {id:'headache',label:'頭痛',options:[{label:'なし',value:'0'},{label:'軽度',value:'1'},{label:'中等度',value:'3'},{label:'重度',value:'5'}]},
  {id:'orientation',label:'見当識',options:[{label:'正常',value:'0'},{label:'日付が不確実',value:'1'},{label:'日付が2日以上ずれている',value:'3'},{label:'人物/場所の見当識障害',value:'4'}]},
]
export default function CIWAArPage(){
  const [vals,setVals]=useState<Record<string,string>>(Object.fromEntries(items.map(i=>[i.id,'0'])))
  const result=useMemo(()=>{
    const score=Object.values(vals).reduce((s,v)=>s+Number(v),0)
    if(score>=20) return {score,severity:'dn' as const,label:'重症（≧20）: ICU管理・積極的BZD投与。振戦せん妄(DT)の高リスク'}
    if(score>=10) return {score,severity:'wn' as const,label:'中等症（10-19）: BZD投与検討。症状に基づくプロトコル(symptom-triggered)'}
    return {score,severity:'ok' as const,label:'軽症（<10）: 経過観察。BZD不要の場合が多い'}
  },[vals])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="CIWA-Ar" value={result.score} unit="/67点" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">CIWA-Arとは</h2><p>Clinical Institute Withdrawal Assessment for Alcohol, revised。アルコール離脱症候群の重症度を10項目で評価。Symptom-triggered therapyの指標として使用：スコア≧10でBZD投与、1-2時間毎に再評価。</p></section>}
      relatedTools={[]} references={[{text:'Sullivan JT et al. Assessment of alcohol withdrawal: the revised clinical institute withdrawal assessment for alcohol scale (CIWA-Ar). Br J Addict 1989;84:1353-1357'}]}
    >
      <div className="space-y-4">{items.map(i=><RadioGroup key={i.id} id={i.id} label={i.label} options={i.options} value={vals[i.id]} onChange={v=>setVals(p=>({...p,[i.id]:v}))} />)}</div>
    </CalculatorLayout>
  )
}
