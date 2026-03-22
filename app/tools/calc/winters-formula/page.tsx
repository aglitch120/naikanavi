'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('winters-formula')!

export default function WintersFormulaPage() {
  const [hco3, setHco3] = useState('15')
  const [pco2, setPco2] = useState('28')

  const result = useMemo(() => {
    const hco3Val = parseFloat(hco3)
    if (!hco3Val || hco3Val <= 0) return null

    const expectedLow = 1.5 * hco3Val + 8 - 2
    const expectedHigh = 1.5 * hco3Val + 8 + 2
    const expectedMid = 1.5 * hco3Val + 8

    const pco2Val = parseFloat(pco2)
    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'

    if (pco2Val) {
      if (pco2Val < expectedLow) {
        interpretation = '実測pCO2 < 予測 — 呼吸性アルカローシスの合併'
        severity = 'wn'
      } else if (pco2Val > expectedHigh) {
        interpretation = '実測pCO2 > 予測 — 呼吸性アシドーシスの合併'
        severity = 'dn'
      } else {
        interpretation = '適切な呼吸性代償（単純な代謝性アシドーシス）'
        severity = 'ok'
      }
    } else {
      interpretation = '実測pCO2を入力すると代償の適切性を判定します'
    }

    return {
      expectedLow: expectedLow.toFixed(1),
      expectedHigh: expectedHigh.toFixed(1),
      expectedMid: expectedMid.toFixed(1),
      severity,
      interpretation,
    }
  }, [hco3, pco2])

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
          label="予測 pCO2"
          value={result.expectedMid}
          unit="mmHg"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: '予測範囲', value: `${result.expectedLow}〜${result.expectedHigh} mmHg` },
          ]}
        />
      )}
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Albert MS, Dell RB, Winters RW. Ann Intern Med 1967;66:312-322' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="hco3" label="HCO₃⁻" unit="mEq/L" value={hco3} onChange={setHco3} min={1} max={40} step={0.1} />
        <NumberInput id="pco2" label="実測pCO₂（任意）" unit="mmHg" hint="入力すると代償の適切性を判定" value={pco2} onChange={setPco2} min={10} max={100} step={0.1} />
      </div>
    </CalculatorLayout>
  )
}
