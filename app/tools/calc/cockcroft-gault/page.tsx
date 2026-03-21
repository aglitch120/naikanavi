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
  if (ccr >= 30) return '中等度低下 — 多くの薬剤で用量調整が必要'
  if (ccr >= 15) return '高度低下 — 要減量・禁忌薬剤の確認'
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
        <ResultCard
          label="クレアチニンクリアランス"
          value={result.ccr.toFixed(1)}
          unit="mL/min"
          interpretation={result.label}
          severity={result.severity}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">Cockcroft-Gault式とは</h2>
          <p>Cockcroft-Gault式は、血清クレアチニン値からクレアチニンクリアランス（CCr）を推算する計算式です。多くの薬剤の添付文書がCCrに基づいて用量調整を記載しています。</p>
          <p className="font-mono bg-bg p-2 rounded text-xs">CCr = (140 - 年齢) × 体重(kg) / (72 × Cr) × (0.85 if 女性)</p>
          <h3 className="font-bold text-tx">eGFRとの使い分け</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>CCr: 薬剤の用量調整（添付文書に準拠）</li>
            <li>eGFR: CKDの病期分類・腎機能評価</li>
            <li>CCrはGFRより約10〜15%高値（尿細管からのCr分泌を含むため）</li>
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
        { text: 'Cockcroft DW, Gault MH. Nephron 1976;16:31-41' },
      ]}
    >
      <div className="space-y-4">
        <RadioGroup name="sex" label="性別" value={sex} onChange={setSex} options={[{ value: 'male', label: '男性' }, { value: 'female', label: '女性' }]} />
        <NumberInput id="age" label="年齢" unit="歳" value={age} onChange={setAge} min={1} max={120} step={1} />
        <NumberInput id="weight" label="体重" unit="kg" value={weight} onChange={setWeight} min={1} max={300} step={0.1} />
        <NumberInput id="cr" label="血清クレアチニン" unit="mg/dL" value={cr} onChange={setCr} min={0.1} max={30} step={0.01} />
      </div>
    </CalculatorLayout>
  )
}
