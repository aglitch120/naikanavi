'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('cfs')!
const levels=[
  {label:'1: 非常に元気 — 活動的、精力的、意欲的',value:'1'},{label:'2: 元気 — 活動的だがレベル1ほどではない',value:'2'},
  {label:'3: うまく対処 — 医学的問題はあるが自立している',value:'3'},{label:'4: 脆弱 — 日常は自立だが活動が制限される',value:'4'},
  {label:'5: 軽度フレイル — IADLの一部に援助が必要',value:'5'},{label:'6: 中等度フレイル — 外出や家事に援助が必要',value:'6'},
  {label:'7: 重度フレイル — ADL全般に依存。ただし安定',value:'7'},{label:'8: 非常に重度 — 完全依存、終末期に近い',value:'8'},
  {label:'9: 終末期 — 予後が限られる可能性（個別の臨床評価が必要）',value:'9'},
]
export default function CFSPage(){
  const [val,setVal]=useState('1')
  const v=Number(val);const sev=v<=3?'ok' as const:v<=5?'wn' as const:'dn' as const
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="CFS" value={val} unit="/9" interpretation={v<=3?'フレイルなし':v===4?'脆弱（Vulnerable）':v<=5?'軽度フレイル':'中等度〜重度フレイル'} severity={sev} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Rockwood K et al. A global clinical measure of fitness and frailty in elderly people. CMAJ 2005;173:489-495'}]}
    >
      <RadioGroup id="cfs" label="最も当てはまるレベル" options={levels} value={val} onChange={setVal} />
    </CalculatorLayout>
  )
}
