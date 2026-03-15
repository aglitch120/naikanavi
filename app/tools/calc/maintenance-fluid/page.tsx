'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('maintenance-fluid')!

function calc421(weight: number): { mlPerHour: number; mlPerDay: number } {
  let rate = 0
  if (weight <= 10) {
    rate = weight * 4
  } else if (weight <= 20) {
    rate = 40 + (weight - 10) * 2
  } else {
    rate = 60 + (weight - 20) * 1
  }
  return { mlPerHour: rate, mlPerDay: rate * 24 }
}

export default function MaintenanceFluidPage() {
  const [weight, setWeight] = useState('')

  const result = useMemo(() => {
    const w = parseFloat(weight)
    if (!w || w <= 0) return null
    const { mlPerHour, mlPerDay } = calc421(w)
    return { mlPerHour, mlPerDay, weight: w }
  }, [weight])

  return (
    <CalculatorLayout
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard
          label="維持輸液量（4-2-1ルール）"
          value={result.mlPerHour.toFixed(0)}
          unit="mL/時"
          interpretation={`1日量: ${result.mlPerDay.toFixed(0)} mL/日`}
          severity="ok"
          details={[
            { label: '最初の10kg', value: `${Math.min(result.weight, 10) * 4} mL/時` },
            ...(result.weight > 10 ? [{ label: '次の10kg', value: `${Math.min(result.weight - 10, 10) * 2} mL/時` }] : []),
            ...(result.weight > 20 ? [{ label: '残り', value: `${(result.weight - 20) * 1} mL/時` }] : []),
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">4-2-1ルール（Holliday-Segar法）とは</h2>
          <p>維持輸液量を体重から簡易的に計算する方法です。</p>
          <h3 className="font-bold text-tx">計算方法</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>最初の10 kg: 4 mL/kg/時</li>
            <li>次の10 kg: 2 mL/kg/時</li>
            <li>それ以上: 1 mL/kg/時</li>
          </ul>
          <h3 className="font-bold text-tx">補正が必要な場合</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>発熱: 体温1℃上昇ごとに10〜12%増量</li>
            <li>ドレーン排液・嘔吐・下痢: 喪失量を追加</li>
            <li>心不全・腎不全: 減量を考慮</li>
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
        { text: 'Holliday MA, Segar WE. Pediatrics 1957;19:823-832' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="weight" label="体重" unit="kg" value={weight} onChange={setWeight} min={1} max={300} step={0.1} />
      </div>
    </CalculatorLayout>
  )
}
