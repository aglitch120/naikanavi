'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('tsat')!

export default function TSATPage() {
  const [serumIron, setSerumIron] = useState('60')
  const [tibc, setTibc] = useState('350')

  const result = useMemo(() => {
    const fe = parseFloat(serumIron)
    const tibcVal = parseFloat(tibc)
    if (!fe || !tibcVal || tibcVal === 0) return null

    const tsat = (fe / tibcVal) * 100

    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (tsat < 16) {
      interpretation = 'TSAT著明低値 — 鉄欠乏が強く疑われる（機能的鉄欠乏含む）'
      severity = 'dn'
    } else if (tsat < 20) {
      interpretation = 'TSAT低値 — 鉄欠乏を示唆。CKD患者では鉄補充を考慮（フェリチン値と合わせて担当医が判断）'
      severity = 'wn'
    } else if (tsat > 50) {
      interpretation = 'TSAT高値 — 鉄過剰を考慮（ヘモクロマトーシス・輸血後・鉄剤過量）'
      severity = 'wn'
    } else if (tsat > 45) {
      interpretation = 'TSAT軽度高値 — 鉄過剰の精査を考慮（フェリチンと合わせて評価）'
      severity = 'wn'
    } else {
      interpretation = '正常範囲（20〜45%）'
    }

    return {
      tsat: tsat.toFixed(1),
      severity,
      interpretation,
    }
  }, [serumIron, tibc])

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
          label="TSAT"
          value={result.tsat}
          unit="%"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: '正常範囲', value: '20〜45%' },
            { label: '鉄欠乏の閾値', value: '<20%（CKD: TSAT<20%かつフェリチン低値で鉄補充を考慮）' },
            { label: '鉄過剰の閾値', value: '>45%' },
          ]}
        />
      )}
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'KDIGO 2012 Clinical Practice Guideline for Anemia in CKD. Kidney Int Suppl 2012;2:279-335' },
        { text: 'Camaschella C. Iron-deficiency anemia. N Engl J Med 2015;372:1832-1843' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="serumIron" label="血清鉄 (Fe)" unit="μg/dL" value={serumIron} onChange={setSerumIron} min={1} max={500} step={1} />
        <NumberInput id="tibc" label="TIBC（総鉄結合能）" unit="μg/dL" value={tibc} onChange={setTibc} min={50} max={700} step={1} />
      </div>
    </CalculatorLayout>
  )
}
