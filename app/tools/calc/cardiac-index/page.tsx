'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('cardiac-index')!


export default function Page() {
  const [co, setCo] = useState('')
  const [height, setHeight] = useState('170')
  const [weight, setWeight] = useState('60')

  const result = useMemo(() => {
    const c = parseFloat(co), h = parseFloat(height), w = parseFloat(weight)
    if (!c || !h || !w) return null
    const bsa = 0.007184 * Math.pow(h, 0.725) * Math.pow(w, 0.425)
    const ci = c / bsa
    const sev = ci < 2.2 ? 'dn' as const : ci < 2.5 ? 'wn' as const : ci > 4.2 ? 'wn' as const : 'ok' as const
    const label = ci < 2.2 ? '低心拍出（ショックリスク）' : ci < 2.5 ? 'やや低下' : ci > 4.2 ? '高心拍出（敗血症等）' : '正常範囲'
    return { ci, bsa, sev, label }
  }, [co, height, weight])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn}
      description={toolDef.description} category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard label="心係数 (CI)" value={`${result.ci.toFixed(2)} L/min/m²`} interpretation={result.label} severity={result.sev}
          details={[
            { label: 'BSA', value: `${result.bsa.toFixed(2)} m²` },
            { label: '基準値', value: '2.5-4.2 L/min/m²' },
          ]} />
      )}>
      <NumberInput id="f1" label="心拍出量 CO (L/min)" value={co} onChange={setCo} min={0} step={0.1} />
      <NumberInput id="f2" label="身長 (cm)" value={height} onChange={setHeight} min={0} />
      <NumberInput id="f3" label="体重 (kg)" value={weight} onChange={setWeight} min={0} />
    </CalculatorLayout>
  )
}

