'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('svri')!


export default function Page() {
  const [map, setMap] = useState('')
  const [cvp, setCvp] = useState('8')
  const [co, setCo] = useState('')
  const [height, setHeight] = useState('170')
  const [weight, setWeight] = useState('60')

  const result = useMemo(() => {
    const m = parseFloat(map), c = parseFloat(cvp), o = parseFloat(co), h = parseFloat(height), w = parseFloat(weight)
    if (!m || !o || h <= 0 || w <= 0 || o <= 0) return null
    const bsa = 0.007184 * Math.pow(h, 0.725) * Math.pow(w, 0.425)
    const ci = o / bsa
    const svri = ((m - (c || 0)) / ci) * 80
    const sev = svri < 1600 ? 'wn' as const : svri > 2400 ? 'dn' as const : 'ok' as const
    const label = svri < 1600 ? '低値（分布異常性ショック等）' : svri > 2400 ? '高値（心原性ショック/低体温等）' : '正常範囲'
    return { svri, ci, bsa, sev, label }
  }, [map, cvp, co, height, weight])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn}
      description={toolDef.description} category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard label="SVRI" value={`${result.svri.toFixed(0)} dyn·s·cm⁻⁵·m²`} interpretation={result.label} severity={result.sev}
          details={[
            { label: 'CI', value: `${result.ci.toFixed(2)} L/min/m²` },
            { label: '基準値', value: '1600-2400 dyn·s·cm⁻⁵·m²' },
          ]} />
      )}>
      <NumberInput id="f1" label="平均動脈圧 MAP (mmHg)" value={map} onChange={setMap} min={0} />
      <NumberInput id="f2" label="中心静脈圧 CVP (mmHg)" value={cvp} onChange={setCvp} min={0} />
      <NumberInput id="f3" label="心拍出量 CO (L/min)" value={co} onChange={setCo} min={0} step={0.1} />
      <NumberInput id="f4" label="身長 (cm)" value={height} onChange={setHeight} min={0} />
      <NumberInput id="f5" label="体重 (kg)" value={weight} onChange={setWeight} min={0} />
    </CalculatorLayout>
  )
}

