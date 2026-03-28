'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('canadian-cspine')!
export default function CanadianCSpinePage(){
  const [step,setStep]=useState(1);const [result,setResult]=useState<{label:string,sev:'ok'|'wn'|'dn'}|null>(null)
  const decide=(ct:boolean)=>setResult(ct?{label:'頚椎画像検査が必要',sev:'wn'}:{label:'頚椎画像不要 → 頚椎カラー除去可能',sev:'ok'})
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result?<ResultCard label="CCR判定" value={result.label} severity={result.sev} />:<ResultCard label="CCR" value="質問に回答してください" severity="ok" />}
      explanation={<div className="text-sm text-muted"><p>※適用条件: GCS 15・頸部痛あり・受傷後48時間以内の成人患者。GCS低下、麻痺、既知の頸椎疾患がある場合は適用外。</p></div>}
      relatedTools={[]} references={[{text:'Stiell IG et al. The Canadian C-Spine Rule versus the NEXUS Low-Risk Criteria in Patients with Trauma. NEJM 2003;349:2510-2518'}]}
    >
      <div className="space-y-4">
        {step===1&&!result&&(<div className="bg-s0 border border-br rounded-xl p-4"><p className="text-sm font-bold text-tx mb-3">Step 1: 高リスク因子はあるか?</p><p className="text-xs text-muted mb-3">65歳以上 / 危険な受傷機転 / 四肢のしびれ</p>
          <div className="flex gap-2"><button onClick={()=>decide(true)} className="flex-1 py-2 bg-dn/10 text-dn rounded-lg text-sm font-medium border border-dn/20">はい → CT必要</button><button onClick={()=>setStep(2)} className="flex-1 py-2 bg-ac/10 text-ac rounded-lg text-sm font-medium border border-ac/20">いいえ → Step 2へ</button></div></div>)}
        {step===2&&!result&&(<div className="bg-s0 border border-br rounded-xl p-4"><p className="text-sm font-bold text-tx mb-3">Step 2: 低リスク因子が1つ以上あるか?</p><p className="text-xs text-muted mb-3">単純な追突事故 / 座位で歩行可 / 遅発性の頸部痛 / 頸椎正中圧痛なし</p>
          <div className="flex gap-2"><button onClick={()=>setStep(3)} className="flex-1 py-2 bg-ac/10 text-ac rounded-lg text-sm font-medium border border-ac/20">はい → Step 3へ</button><button onClick={()=>decide(true)} className="flex-1 py-2 bg-dn/10 text-dn rounded-lg text-sm font-medium border border-dn/20">いいえ → CT必要</button></div></div>)}
        {step===3&&!result&&(<div className="bg-s0 border border-br rounded-xl p-4"><p className="text-sm font-bold text-tx mb-3">Step 3: 能動的に頸部を左右45°回旋できるか?</p>
          <div className="flex gap-2"><button onClick={()=>decide(false)} className="flex-1 py-2 bg-ac/10 text-ac rounded-lg text-sm font-medium border border-ac/20">はい → 画像不要</button><button onClick={()=>decide(true)} className="flex-1 py-2 bg-dn/10 text-dn rounded-lg text-sm font-medium border border-dn/20">いいえ → CT必要</button></div></div>)}
        {result&&<button onClick={()=>{setStep(1);setResult(null)}} className="text-sm text-ac hover:underline">最初からやり直す</button>}
      </div>
    </CalculatorLayout>
  )
}
