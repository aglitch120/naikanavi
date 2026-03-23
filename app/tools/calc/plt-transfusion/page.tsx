'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('plt-transfusion')!
export default function PltTransfusionPage() {
  const [units, setUnits] = useState('10')
  const [weight, setWeight] = useState('60')
  const [currentPlt, setCurrentPlt] = useState('1.0')
  const result = useMemo(() => {
    const u = parseInt(units), w = parseFloat(weight), plt = parseFloat(currentPlt)
    if (!u || !w) return null
    // 10単位PC: 約2.0×10^11個の血小板含有, 循環血液量≒70mL/kg
    const pltRise = (u / 10) * 2.0 / (w * 0.07) * 0.667 // 回収率2/3
    const expected = plt ? (plt + pltRise).toFixed(1) : null
    return { pltRise: pltRise.toFixed(1), expected }
  }, [units, weight, currentPlt])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity="ok"
        value={`予測Plt上昇 ≒ ${result.pltRise} 万/μL`}
        interpretation={result.expected ? `予測Plt ≒ ${result.expected} 万/μL\n\n` : '' + '10単位PCで体重60kgの場合、約3-5万/μL上昇（回収率2/3として）。\n脾腫・DIC・HIT等では上昇が不良になる。'} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">予測上昇:</strong> Plt上昇 = 輸血血小板数 / (循環血液量L × 1000) × 回収率(2/3)</p><p>10単位PC = 約2.0×10¹¹個含有。1時間後と24時間後に評価。</p></div>}
      relatedTools={[{ href: '/tools/calc/cci-platelet', name: 'CCI' }, { href: '/tools/calc/rbc-transfusion-hb', name: 'RBC輸血Hb上昇' }]}
      references={toolDef.sources || []}
    >
      <NumberInput label="PC投与単位数" value={units} onChange={setUnits} />
      <NumberInput label="体重 (kg)" value={weight} onChange={setWeight} />
      <NumberInput label="現在のPlt (万/μL) ※任意" value={currentPlt} onChange={setCurrentPlt} step="0.1" />
    </CalculatorLayout>
  )
}
