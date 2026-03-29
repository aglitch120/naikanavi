'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('anaphylaxis')!
const items=[{id:'criterion1',label:'皮膚/粘膜症状（蕁麻疹/紅潮/浮腫）+ 呼吸器症状 or 低血圧 → 急速発症（数分〜数時間）'},{id:'criterion2',label:'アレルゲン曝露後の急速発症（数分〜数時間）で以下の2つ以上: 皮膚粘膜症状/呼吸器症状/低血圧/消化器症状'},{id:'criterion3',label:'既知のアレルゲン曝露後の急速な血圧低下（成人sBP<90 or ベースラインの30%以上低下）'}]
export default function Page(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(items.map(i=>[i.id,false])))
  const count=useMemo(()=>items.filter(i=>checks[i.id]).length,[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="アナフィラキシー診断基準" value={count+'/'+items.length+'項目'} interpretation={count>=1?'アナフィラキシーの診断基準を満たす可能性あり — 緊急病態の可能性。直ちに担当医が評価・判断':'アナフィラキシーの診断基準を満たさない'} severity={count>=1?'dn' as const:'ok' as const} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Sampson HA, et al. J Allergy Clin Immunol 2006;117:391-397 (NIAID/FAAN criteria)'},{text:'日本アレルギー学会. アナフィラキシーガイドライン2022'}]}
    ><div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))}/>)}</div></CalculatorLayout>
  )
}