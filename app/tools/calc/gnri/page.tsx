'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('gnri')!
export default function GNRIPage(){
  const [alb,setAlb]=useState('3.5')
  const [weight,setWeight]=useState('60')
  const [idealWeight,setIdealWeight]=useState('63')
  const result=useMemo(()=>{
    const a=Number(alb)||0;const w=Number(weight)||0;const iw=Number(idealWeight)||1
    const wRatio=Math.min(w/iw,1)
    const gnri=14.89*a+41.7*wRatio
    const sev=gnri>=98?'ok' as const:gnri>=92?'wn' as const:'dn' as const
    const label=gnri>=98?'リスクなし（≧98）':gnri>=92?'軽度リスク（92-98）':gnri>=82?'中等度リスク（82-92）':'重度リスク（<82）'
    return {gnri:gnri.toFixed(1),severity:sev,label}
  },[alb,weight,idealWeight])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="GNRI" value={result.gnri} interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">GNRIとは</h2><p>Geriatric Nutritional Risk Index。入院高齢者の栄養関連リスクを評価。GNRI = 14.89 × Alb(g/dL) + 41.7 × (体重/理想体重)。理想体重はBMI22から算出。</p></section>}
      relatedTools={[]} references={[{text:'Bouillanne O et al. Geriatric Nutritional Risk Index: a new index for evaluating at-risk elderly medical patients. Am J Clin Nutr 2005;82:777-783'}]}
    >
      <div className="space-y-3">
        <NumberInput id="alb" label="アルブミン" value={alb} onChange={setAlb} unit="g/dL" />
        <NumberInput id="weight" label="現在の体重" value={weight} onChange={setWeight} unit="kg" />
        <NumberInput id="ideal" label="理想体重(BMI22)" value={idealWeight} onChange={setIdealWeight} unit="kg" />
      </div>
    </CalculatorLayout>
  )
}
