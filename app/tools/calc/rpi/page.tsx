'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('rpi')!


export default function Page() {
  const [retic, setRetic] = useState('')
  const [hct, setHct] = useState('')
  const [normalHct] = useState('45')

  const result = useMemo(() => {
    const r = parseFloat(retic), h = parseFloat(hct), nh = parseFloat(normalHct)
    if (!r || !h || !nh) return null
    // Correction factor for maturation time
    const matFactor = h >= 36 ? 1 : h >= 26 ? 1.5 : h >= 16 ? 2 : 2.5
    const correctedRetic = r * (h / nh)
    const rpi = correctedRetic / matFactor
    const sev = rpi < 2 ? 'wn' as const : 'ok' as const
    const label = rpi >= 2 ? '骨髄反応あり（溶血/出血）' : '骨髄反応不良（産生低下）'
    return { rpi, correctedRetic, matFactor, sev, label }
  }, [retic, hct, normalHct])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn}
      description={toolDef.description} category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard label="RPI" value={result.rpi.toFixed(2)} interpretation={result.label} severity={result.sev}
          details={[
            { label: '補正網赤血球数', value: `${result.correctedRetic.toFixed(2)}%` },
            { label: '成熟係数', value: result.matFactor.toString() },
            { label: '≧2', value: '溶血性貧血/出血後（骨髄反応あり）' },
            { label: '<2', value: '再生不良/鉄欠乏/慢性疾患（産生低下）' },
          ]} />
      )}>
      <NumberInput id="f1" label="網赤血球数 (%)" value={retic} onChange={setRetic} min={0} step={0.1} />
      <NumberInput id="f2" label="Hct (%)" value={hct} onChange={setHct} min={0} step={1} />
    </CalculatorLayout>
  )
}

