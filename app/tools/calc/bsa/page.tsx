'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('bsa')!

// Du Bois式: BSA = 0.007184 × H^0.725 × W^0.425
function calcDuBois(h: number, w: number): number {
  return 0.007184 * Math.pow(h, 0.725) * Math.pow(w, 0.425)
}

// 新谷式（日本人向け）: BSA = 0.007241 × H^0.725 × W^0.425
function calcShintani(h: number, w: number): number {
  return 0.007241 * Math.pow(h, 0.725) * Math.pow(w, 0.425)
}

// Mosteller式: BSA = √(H×W/3600)
function calcMosteller(h: number, w: number): number {
  return Math.sqrt((h * w) / 3600)
}

export default function BsaPage() {
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')

  const result = useMemo(() => {
    const h = parseFloat(height)
    const w = parseFloat(weight)
    if (!h || !w || h <= 0 || w <= 0) return null

    return {
      duBois: calcDuBois(h, w),
      shintani: calcShintani(h, w),
      mosteller: calcMosteller(h, w),
    }
  }, [height, weight])

  return (
    <CalculatorLayout
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard
          label="体表面積（Du Bois式）"
          value={`${result.duBois.toFixed(4)} m²`}
          severity="ok"
          details={[
            { label: '新谷式（日本人向け）', value: `${result.shintani.toFixed(4)} m²` },
            { label: 'Mosteller式', value: `${result.mosteller.toFixed(4)} m²` },
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">BSA（体表面積）とは</h2>
          <p>体表面積は、抗がん剤の投与量算出、心拍出量の指数化（CI）、GFR補正など、臨床で広く用いられる指標です。</p>
          <h3 className="font-bold text-tx">計算式</h3>
          <p className="font-mono bg-bg p-2 rounded text-xs">Du Bois: BSA = 0.007184 × H(cm)^0.725 × W(kg)^0.425</p>
          <p className="font-mono bg-bg p-2 rounded text-xs mt-1">Mosteller: BSA = √(H(cm) × W(kg) / 3600)</p>
          <h3 className="font-bold text-tx">臨床での使用場面</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>抗がん剤の投与量算出（mg/m²）</li>
            <li>心係数（CI = CO/BSA）の算出</li>
            <li>GFRの体表面積補正（mL/min/1.73m²）</li>
            <li>熱傷面積の評価</li>
          </ul>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Du Bois D, Du Bois EF. Arch Intern Med 1916;17:863-871' },
        { text: 'Mosteller RD. N Engl J Med 1987;317:1098' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="height" label="身長" unit="cm" value={height} onChange={setHeight} min={50} max={250} step={0.1} />
        <NumberInput id="weight" label="体重" unit="kg" value={weight} onChange={setWeight} min={1} max={500} step={0.1} />
      </div>
    </CalculatorLayout>
  )
}
