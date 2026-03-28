'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('maintenance-fluid')!

function calc421(weight: number) {
  let rate = 0
  if (weight <= 10) rate = weight * 4
  else if (weight <= 20) rate = 40 + (weight - 10) * 2
  else rate = 60 + (weight - 20) * 1
  return { mlPerHour: rate, mlPerDay: rate * 24 }
}

const scenarios = [
  { value: 'ward', label: '病棟維持輸液（安静・絶食）', rate: 25, desc: '25-30 mL/kg/日' },
  { value: 'periop', label: '術中輸液（4-2-1ルール）', rate: 0, desc: 'Holliday-Segar法' },
  { value: 'restrict', label: '水分制限（心不全・腎不全等）', rate: 20, desc: '20-25 mL/kg/日' },
]

export default function MaintenanceFluidPage() {
  const [weight, setWeight] = useState('60')
  const [scenario, setScenario] = useState('ward')

  const result = useMemo(() => {
    const w = parseFloat(weight)
    if (!w || w <= 0) return null

    if (scenario === 'periop') {
      const { mlPerHour, mlPerDay } = calc421(w)
      return {
        mlPerHour,
        mlPerDay,
        label: '術中維持輸液（4-2-1ルール）',
        details: [
          { label: '最初の10kg', value: `${Math.min(w, 10) * 4} mL/時` },
          ...(w > 10 ? [{ label: '次の10kg', value: `${Math.min(w - 10, 10) * 2} mL/時` }] : []),
          ...(w > 20 ? [{ label: '残り', value: `${(w - 20) * 1} mL/時` }] : []),
        ],
      }
    }

    const low = scenario === 'restrict' ? 20 : 25
    const high = scenario === 'restrict' ? 25 : 30
    const mlPerDayLow = Math.round(w * low)
    const mlPerDayHigh = Math.round(w * high)
    const mlPerHourLow = Math.round(mlPerDayLow / 24)
    const mlPerHourHigh = Math.round(mlPerDayHigh / 24)

    return {
      mlPerHour: mlPerHourLow,
      mlPerDay: mlPerDayLow,
      label: scenario === 'restrict' ? '維持輸液量（水分制限）' : '維持輸液量',
      details: [
        { label: `${low} mL/kg/日`, value: `${mlPerDayLow} mL/日（${mlPerHourLow} mL/hr）` },
        { label: `${high} mL/kg/日`, value: `${mlPerDayHigh} mL/日（${mlPerHourHigh} mL/hr）` },
      ],
    }
  }, [weight, scenario])

  return (
    <CalculatorLayout
      slug={toolDef.slug}
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard
          label={result.label}
          value={scenario === 'periop' ? result.mlPerHour.toFixed(0) : `${result.mlPerDay}`}
          unit={scenario === 'periop' ? 'mL/時' : 'mL/日'}
          interpretation={scenario === 'periop'
            ? `1日量: ${result.mlPerDay} mL/日`
            : `${result.mlPerHour} mL/hr`}
          severity="ok"
          details={result.details}
        />
      )}
      explanation={<div className="text-sm text-muted space-y-1">
        <p>病棟維持輸液: 25-30 mL/kg/日が一般的。心不全・腎不全では20-25 mL/kg/日に制限。</p>
        <p>4-2-1ルール(Holliday-Segar法): 主に麻酔科の術中輸液量算出に使用。</p>
      </div>}
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: '日本版敗血症診療ガイドライン2020 — 輸液管理' },
        { text: 'Holliday MA, Segar WE. Pediatrics 1957;19:823-832' },
        { text: 'NICE CG174: IV fluid therapy in adults in hospital (2013)' },
      ]}
    >
      <div className="space-y-4">
        <fieldset>
          <legend className="block text-sm font-medium text-tx mb-2">シナリオ</legend>
          <div className="space-y-1.5">
            {scenarios.map(s => (
              <button key={s.value} onClick={() => setScenario(s.value)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${scenario === s.value ? 'border-ac bg-ac/10 text-ac font-semibold' : 'border-br bg-s0 text-tx hover:border-ac/30'}`}>
                <span className="font-bold">{s.label}</span>
                <span className="text-muted ml-1.5">{s.desc}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <NumberInput id="weight" label="体重" unit="kg" value={weight} onChange={setWeight} min={1} max={300} step={0.1} />
      </div>
    </CalculatorLayout>
  )
}
