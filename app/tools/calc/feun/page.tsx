'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('feun')!

export default function FeunPage() {
  const [uUN, setUUN] = useState('500')
  const [sUN, setSUN] = useState('20')
  const [uCr, setUCr] = useState('100')
  const [sCr, setSCr] = useState('1.0')

  const result = useMemo(() => {
    const uun = parseFloat(uUN), sun = parseFloat(sUN), uc = parseFloat(uCr), sc = parseFloat(sCr)
    if (!uun || !sun || !uc || !sc) return null
    const feun = (uun * sc) / (sun * uc) * 100
    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (feun < 35) {
      interpretation = 'FEUN < 35% — 腎前性AKI（有効循環血漿量低下）を示唆'
      severity = 'wn'
    } else if (feun <= 50) {
      interpretation = 'FEUN 35〜50% — 境界域'
      severity = 'wn'
    } else {
      interpretation = 'FEUN > 50% — 腎性AKI（ATN等）を示唆'
      severity = 'dn'
    }
    return { feun: feun.toFixed(2), severity, interpretation }
  }, [uUN, sUN, uCr, sCr])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity={result.severity} value={`FEUN = ${result.feun}%`} interpretation={result.interpretation} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">計算式:</strong> FEUN = (尿UN × 血清Cr) / (血清UN × 尿Cr) × 100</p><p><strong className="text-tx">臨床的意義:</strong> 利尿薬使用中はFENaが上昇するため、FEUNがAKIの鑑別に有用。&lt;35%で腎前性を示唆。</p></div>}
      relatedTools={[{ slug: 'fena', name: 'FENa' }, { slug: 'fek', name: 'FEK' }, { slug: 'feua', name: 'FEUA' }]}
      references={toolDef.sources || []}
    >
      <NumberInput label="尿中UN (mg/dL)" value={uUN} onChange={setUUN} />
      <NumberInput label="血清UN (mg/dL)" value={sUN} onChange={setSUN} />
      <NumberInput label="尿中Cr (mg/dL)" value={uCr} onChange={setUCr} />
      <NumberInput label="血清Cr (mg/dL)" value={sCr} onChange={setSCr} step="0.1" />
    </CalculatorLayout>
  )
}
