'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('rbc-transfusion-hb')!
export default function RbcTransfusionPage() {
  const [units, setUnits] = useState('2')
  const [weight, setWeight] = useState('60')
  const [currentHb, setCurrentHb] = useState('7.0')
  const result = useMemo(() => {
    const u = parseFloat(units), w = parseFloat(weight), hb = parseFloat(currentHb)
    if (!u || !w) return null
    const hbRise = (u * 400 * 0.19) / (w * 0.07 * 10)
    const expectedHb = hb ? (hb + hbRise).toFixed(1) : null
    return { hbRise: hbRise.toFixed(1), expectedHb }
  }, [units, weight, currentHb])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity="ok"
        value={`予測Hb上昇 ≒ ${result.hbRise} g/dL`}
        interpretation={result.expectedHb ? `予測Hb ≒ ${result.expectedHb} g/dL\n\n` : '' + `RCC-LR 1単位(約140mL赤血球): Hb約${(parseFloat(result.hbRise) / parseFloat(units)).toFixed(1)}g/dL上昇/単位\n※ 出血・溶血がなければの理論値。実測で確認必要。`} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">計算式:</strong> Hb上昇 = (単位数 × 400mL × Hct0.19) / (体重kg × 0.07 × 10)</p><p>目安: 体重60kgで1単位あたり約0.5-0.7 g/dL上昇</p></div>}
      relatedTools={[{ slug: 'restrictive-transfusion', name: '制限的輸血Hb' }, { slug: 'anemia-criteria', name: '貧血の診断基準' }]}
      references={toolDef.sources || []}
    >
      <NumberInput label="RCC-LR 投与単位数" value={units} onChange={setUnits} />
      <NumberInput label="体重 (kg)" value={weight} onChange={setWeight} />
      <NumberInput label="現在のHb (g/dL) ※任意" value={currentHb} onChange={setCurrentHb} step={0.1} />
    </CalculatorLayout>
  )
}
