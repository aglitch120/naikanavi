'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('map')!

export default function MapPage() {
  const [sbp, setSbp] = useState('120')
  const [dbp, setDbp] = useState('80')

  const result = useMemo(() => {
    const s = parseFloat(sbp)
    const d = parseFloat(dbp)
    if (!s || !d) return null

    const mapVal = d + (s - d) / 3
    const pp = s - d

    const severity: 'ok' | 'wn' | 'dn' =
      mapVal < 60 ? 'dn' : mapVal < 65 ? 'wn' : mapVal > 110 ? 'wn' : 'ok'

    let interpretation = ''
    if (mapVal < 60) interpretation = 'MAP低下 — 臓器灌流不全のリスク'
    else if (mapVal < 65) interpretation = 'MAP境界低値'
    else if (mapVal > 110) interpretation = 'MAP高値'
    else interpretation = 'MAP正常範囲（65〜110 mmHg）'

    return { map: mapVal.toFixed(0), pp, severity, interpretation }
  }, [sbp, dbp])

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
          label="MAP"
          value={result.map}
          unit="mmHg"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: '脈圧', value: `${result.pp} mmHg` },
            { label: 'ICU目標', value: '≧65 mmHg' },
          ]}
        />
      )}
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Surviving Sepsis Campaign Guidelines 2021' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="sbp" label="収縮期血圧（SBP）" unit="mmHg" value={sbp} onChange={setSbp} min={40} max={300} step={1} />
        <NumberInput id="dbp" label="拡張期血圧（DBP）" unit="mmHg" value={dbp} onChange={setDbp} min={20} max={200} step={1} />
      </div>
    </CalculatorLayout>
  )
}
