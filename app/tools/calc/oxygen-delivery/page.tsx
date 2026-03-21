'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('oxygen-delivery')!


export default function Page() {
  const [hb, setHb] = useState('')
  const [sao2, setSao2] = useState('98')
  const [pao2, setPao2] = useState('90')
  const [co, setCo] = useState('')
  const [height, setHeight] = useState('170')
  const [weight, setWeight] = useState('60')

  const result = useMemo(() => {
    const h = parseFloat(hb), s = parseFloat(sao2), p = parseFloat(pao2), c = parseFloat(co), ht = parseFloat(height), w = parseFloat(weight)
    if (!h || !s) return null
    const cao2 = (1.34 * h * (s / 100)) + (0.003 * (p || 0))
    if (!c || !ht || !w) return { cao2, do2i: null, bsa: null }
    const bsa = 0.007184 * Math.pow(ht, 0.725) * Math.pow(w, 0.425)
    const ci = c / bsa
    const do2i = ci * cao2 * 10
    return { cao2, do2i, bsa, ci }
  }, [hb, sao2, pao2, co, height, weight])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn}
      description={toolDef.description} category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard label="CaO2" value={`${result.cao2.toFixed(1)} mL O2/dL`}
          interpretation={result.do2i ? `DO2I: ${result.do2i.toFixed(0)} mL/min/m²` : 'CO入力でDO2I計算可'}
          severity={result.do2i && result.do2i < 400 ? 'dn' : result.do2i && result.do2i < 520 ? 'wn' : 'ok'}
          details={[
            { label: 'CaO2', value: `${result.cao2.toFixed(1)} mL O2/dL (基準: 16-22)` },
            ...(result.do2i ? [
              { label: 'DO2I', value: `${result.do2i.toFixed(0)} mL/min/m² (基準: 520-720)` },
              { label: 'CI', value: `${result.ci!.toFixed(2)} L/min/m²` },
            ] : []),
            { label: '計算式', value: 'CaO2 = 1.34×Hb×SaO2 + 0.003×PaO2' },
          ]} />
      )}>
      <NumberInput id="f1" label="Hb (g/dL)" value={hb} onChange={setHb} min={0} step={0.1} />
      <NumberInput id="f2" label="SaO2 (%)" value={sao2} onChange={setSao2} min={0} max={100} step={0.1} />
      <NumberInput id="f3" label="PaO2 (mmHg) ※任意" value={pao2} onChange={setPao2} min={0} />
      <p className="text-[11px] text-muted mt-2 mb-3 font-medium">▼ DO2I算出（任意）</p>
      <NumberInput id="f4" label="心拍出量 CO (L/min)" value={co} onChange={setCo} min={0} step={0.1} />
      <NumberInput id="f5" label="身長 (cm)" value={height} onChange={setHeight} min={0} />
      <NumberInput id="f6" label="体重 (kg)" value={weight} onChange={setWeight} min={0} />
    </CalculatorLayout>
  )
}

