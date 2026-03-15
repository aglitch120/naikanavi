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
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')

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
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">BMI（Body Mass Index）とは</h2>
          <p>BMI（体格指数）は体重(kg)を身長(m)の二乗で割った値で、肥満度の国際的な指標です。</p>
          <p className="font-mono bg-bg p-2 rounded">BMI = 体重(kg) ÷ 身長(m)²</p>
          <h3 className="font-bold text-tx">日本肥満学会の基準</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>＜18.5: 低体重（やせ）</li>
            <li>18.5〜24.9: 普通体重</li>
            <li>25〜29.9: 肥満（1度）</li>
            <li>30〜34.9: 肥満（2度）</li>
            <li>35〜39.9: 肥満（3度）</li>
            <li>≧40: 肥満（4度）</li>
          </ul>
          <p>日本ではBMI 22が最も疾病リスクが低いとされ、これを基に算出した体重を「標準体重」としています。</p>
        </section>
      }
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
