'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('i-road')!
const iItems=[{id:'icu',label:'I: ICU入室が必要 or ショック'},{id:'spo2',label:'SpO₂ > 90%維持にFiO₂ ≧ 0.35が必要'}]
const road=[{id:'chest',label:'R: 胸部X線で一側肺の2/3以上の陰影'},{id:'orientation',label:'O: 意識障害(JCS≧2 新規)'},{id:'age',label:'A: 年齢（男性≧70歳、女性≧75歳）'},{id:'dehydration',label:'D: 脱水 or BUN ≧ 25mg/dL'}]
export default function IROADPage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries([...iItems,...road].map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const hasI=iItems.some(i=>checks[i.id])
    const roadCount=road.filter(i=>checks[i.id]).length
    if(hasI) return {severity:'dn' as const,label:'重症（I群）: ICU管理 + 広域抗菌薬（TAZ/PIPC or MEPM + AZM）'}
    if(roadCount>=2) return {severity:'wn' as const,label:'中等症（ROAD 2項目以上）: 入院管理 + βラクタム + キノロン or マクロライド'}
    return {severity:'ok' as const,label:'軽症（ROAD 0-1項目）: 外来管理可 or 短期入院'}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="I-ROAD" value={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">I-ROADスコアとは</h2><p>院内肺炎（HAP）の重症度分類。I群（ICU要否）とROAD（4項目）の2段階。日本の成人肺炎診療ガイドライン2024で使用。耐性菌リスク因子も別途評価して抗菌薬を選択。</p></section>}
      relatedTools={[]} references={[{text:'日本呼吸器学会. 成人肺炎診療ガイドライン 2024'}]}
    ><div className="space-y-4"><div><p className="text-xs font-bold text-dn mb-2">I群（1つでも→重症）</p><div className="space-y-1">{iItems.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></div><div><p className="text-xs font-bold text-tx mb-2">ROAD（2項目以上→中等症）</p><div className="space-y-1">{road.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></div></div></CalculatorLayout>
  )
}
