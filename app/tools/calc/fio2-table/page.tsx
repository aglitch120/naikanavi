'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('fio2-table')!

const fio2Data: Record<string, { min: number; max: number; fio2: Record<number, number> }> = {
  nasal: { min: 1, max: 6, fio2: { 1: 0.24, 2: 0.28, 3: 0.32, 4: 0.36, 5: 0.40, 6: 0.44 } },
  mask: { min: 5, max: 8, fio2: { 5: 0.40, 6: 0.50, 7: 0.55, 8: 0.60 } },
  reservoir: { min: 8, max: 10, fio2: { 8: 0.80, 9: 0.90, 10: 0.95 } },
}

const deviceLabels: Record<string, string> = { nasal: '鼻カニューラ', mask: '簡易マスク', reservoir: 'リザーバー付マスク' }

export default function Fio2TablePage() {
  const [device, setDevice] = useState('nasal')
  const [flow, setFlow] = useState('2')

  const result = useMemo(() => {
    const d = fio2Data[device]
    const f = parseInt(flow) || 0
    const clamped = Math.max(d.min, Math.min(d.max, f))
    const fio2 = d.fio2[clamped]
    if (!fio2) return null
    return { fio2, fio2Pct: Math.round(fio2 * 100), device: deviceLabels[device], flow: clamped }
  }, [device, flow])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard label="推定FiO2" value={`${result.fio2Pct}%`} interpretation={`${result.device} ${result.flow} L/分`} severity="neutral"
          details={[{ label: 'FiO2（小数）', value: result.fio2.toFixed(2) }]} />
      )}
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'American Association for Respiratory Care Clinical Practice Guideline' }]}
    >
      <div className="space-y-4">
        <RadioGroup label="酸素デバイス" name="device" value={device} onChange={setDevice}
          options={[{ value: 'nasal', label: '鼻カニューラ' }, { value: 'mask', label: '簡易マスク' }, { value: 'reservoir', label: 'リザーバー付' }]} />
        <NumberInput id="flow" label="酸素流量" unit="L/分" value={flow} onChange={setFlow} min={1} max={15} step={1} />
      </div>
    </CalculatorLayout>
  )
}
