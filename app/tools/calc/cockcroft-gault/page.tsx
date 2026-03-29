'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('cockcroft-gault')!

function calcCCr(age: number, weight: number, cr: number, sex: 'male' | 'female'): number {
  const base = ((140 - age) * weight) / (72 * cr)
  return sex === 'female' ? base * 0.85 : base
}

function getSeverity(ccr: number): 'ok' | 'wn' | 'dn' {
  if (ccr >= 60) return 'ok'
  if (ccr >= 30) return 'wn'
  return 'dn'
}

function getLabel(ccr: number): string {
  if (ccr >= 90) return '正常'
  if (ccr >= 60) return '軽度低下'
  if (ccr >= 30) return '中等度低下'
  if (ccr >= 15) return '高度低下'
  return '末期腎不全'
}

export default function CockcroftGaultPage() {
  const [age, setAge] = useState('65')
  const [weight, setWeight] = useState('60')
  const [cr, setCr] = useState('1.2')
  const [sex, setSex] = useState('male')

  const result = useMemo(() => {
    const a = parseFloat(age)
    const w = parseFloat(weight)
    const c = parseFloat(cr)
    if (!a || !w || !c || c <= 0) return null

    const ccr = calcCCr(a, w, c, sex as 'male' | 'female')
    return { ccr, label: getLabel(ccr), severity: getSeverity(ccr) }
  }, [age, weight, cr, sex])

  return (
    <CalculatorLayout
      slug={toolDef.slug}
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <div className="space-y-2">
          <ResultCard
            label="クレアチニンクリアランス"
            value={result.ccr.toFixed(1)}
            unit="mL/min"
            interpretation={result.label}
            severity={result.severity}
          />
          <p className="text-[10px] text-wn px-1">※肥満患者では理想体重(IBW)の使用を検討。CCr≠eGFR（体格補正なし）。薬剤投与量調整にはCCrを使用。</p>
        </div>
      )}
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Cockcroft DW, Gault MH. Nephron 1976;16:31-41' },
      ]}
    >
      <div className="space-y-4">
        <RadioGroup name="sex" label="性別" value={sex} onChange={setSex} options={[{ value: 'male', label: '男性' }, { value: 'female', label: '女性' }]} />
        <NumberInput id="age" label="年齢" unit="歳" value={age} onChange={setAge} min={18} max={120} step={1} />
        <NumberInput id="weight" label="体重" unit="kg" value={weight} onChange={setWeight} min={1} max={300} step={0.1} />
        <NumberInput id="cr" label="血清クレアチニン" unit="mg/dL" value={cr} onChange={setCr} min={0.1} max={30} step={0.01} />
      </div>
    </CalculatorLayout>
  )
}
