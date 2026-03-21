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
      result={<ResultCard label="アナフィラキシー診断基準" value={count+'/'+items.length+'項目'} interpretation={count>=Math.ceil(items.length/2)?'基準を満たす可能性あり':'基準を満たさない'} severity={count>=Math.ceil(items.length/2)?'wn' as const:'ok' as const} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">アナフィラキシー診断基準とは</h2><p>アドレナリン0.3-0.5mg筋注（大腿外側）が第一選択。15分毎に反復可。仰臥位+下肢挙上。輸液。βブロッカー内服中はグルカゴン検討。</p></section>}
      relatedTools={[]} references={[{text:'WAO 2020/アナフィラキシーGL 2022'}]}
    ><div className="space-y-2">{items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))}/>)}</div></CalculatorLayout>
  )
}