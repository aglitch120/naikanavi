'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('bmi')!

function classifyBmi(bmi: number): { label: string; detail: string; severity: 'ok' | 'wn' | 'dn' } {
  // 日本肥満学会基準
  if (bmi < 18.5) return { label: '低体重（やせ）', detail: 'Underweight', severity: 'wn' }
  if (bmi < 25) return { label: '普通体重', detail: 'Normal weight', severity: 'ok' }
  if (bmi < 30) return { label: '肥満（1度）', detail: 'Obese class I', severity: 'wn' }
  if (bmi < 35) return { label: '肥満（2度）', detail: 'Obese class II', severity: 'dn' }
  if (bmi < 40) return { label: '肥満（3度）', detail: 'Obese class III', severity: 'dn' }
  return { label: '肥満（4度）', detail: 'Obese class IV', severity: 'dn' }
}

function idealWeight(height: number): { bmi22: number; bmi20: number; bmi25: number } {
  const h = height / 100
  return {
    bmi20: +(h * h * 20).toFixed(1),
    bmi22: +(h * h * 22).toFixed(1),
    bmi25: +(h * h * 25).toFixed(1),
  }
}

export default function BmiPage() {
  const [height, setHeight] = useState('170')
  const [weight, setWeight] = useState('60')

  const result = useMemo(() => {
    const h = parseFloat(height)
    const w = parseFloat(weight)
    if (!h || !w || h <= 0 || w <= 0) return null

    const bmi = w / ((h / 100) ** 2)
    const classification = classifyBmi(bmi)
    const iw = idealWeight(h)
    return { bmi, classification, idealWeight: iw }
  }, [height, weight])

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
          label="BMI"
          value={result.bmi.toFixed(1)}
          interpretation={result.classification.label}
          severity={result.classification.severity}
          details={[
            { label: '分類', value: result.classification.detail },
            { label: '標準体重（BMI 22）', value: `${result.idealWeight.bmi22} kg` },
            { label: '適正範囲（BMI 20〜25）', value: `${result.idealWeight.bmi20}〜${result.idealWeight.bmi25} kg` },
          ]}
        />
      )}
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: '日本肥満学会「肥満症診療ガイドライン2022」' },
        { text: 'WHO: Body mass index - BMI', url: 'https://www.who.int/data/gho/data/themes/topics/topic-details/GHO/body-mass-index' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="height" label="身長" unit="cm" value={height} onChange={setHeight} min={50} max={250} step={0.1} />
        <NumberInput id="weight" label="体重" unit="kg" value={weight} onChange={setWeight} min={1} max={500} step={0.1} />
      </div>
    </CalculatorLayout>
  )
}
