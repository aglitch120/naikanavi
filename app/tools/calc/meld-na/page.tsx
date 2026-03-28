'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('meld-na')!

export default function MeldNaPage() {
  const [bilirubin, setBilirubin] = useState('2.5')
  const [cr, setCr] = useState('1.5')
  const [inr, setInr] = useState('1.8')
  const [na, setNa] = useState('130')
  const [dialysis, setDialysis] = useState('no')

  const result = useMemo(() => {
    let bil = parseFloat(bilirubin)
    let crVal = parseFloat(cr)
    let inrVal = parseFloat(inr)
    let naVal = parseFloat(na)
    if (!bil || !crVal || !inrVal || !naVal) return null

    if (inrVal < 1) inrVal = 1

    if (bil < 1) bil = 1
    if (crVal < 1) crVal = 1
    if (crVal > 4 || dialysis === 'yes') crVal = 4
    if (naVal < 125) naVal = 125
    if (naVal > 137) naVal = 137

    // MELD(i) = 0.957 × ln(Cr) + 0.378 × ln(Bil) + 1.120 × ln(INR) + 0.643
    const meld = Math.round(
      10 * (0.957 * Math.log(crVal) + 0.378 * Math.log(bil) + 1.120 * Math.log(inrVal) + 0.643)
    )
    const meldCapped = Math.max(6, Math.min(40, meld))

    // MELD-Na = MELD + 1.32 × (137 − Na) − [0.033 × MELD × (137 − Na)]
    const meldNa = Math.round(
      meldCapped + 1.32 * (137 - naVal) - 0.033 * meldCapped * (137 - naVal)
    )
    const meldNaCapped = Math.max(6, Math.min(40, meldNa))

    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (meldNaCapped >= 25) severity = 'dn'
    else if (meldNaCapped >= 15) severity = 'wn'

    let interpretation = ''
    if (meldNaCapped >= 30) interpretation = '3ヶ月死亡率 50%超（※米国UNOS基準。治療方針は担当医が判断）'
    else if (meldNaCapped >= 20) interpretation = '3ヶ月死亡率 約20%（※米国UNOS基準。治療方針は担当医が判断）'
    else if (meldNaCapped >= 10) interpretation = '中等度肝障害'
    else interpretation = '軽度肝障害'

    return { meld: meldCapped, meldNa: meldNaCapped, severity, interpretation }
  }, [bilirubin, cr, inr, na, dialysis])

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
          label="MELD-Na"
          value={result.meldNa}
          unit="/ 40"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: 'MELD（Na補正前）', value: `${result.meld}` },
          ]}
        />
      )}
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Kim WR, et al. Hepatology 2008;47:1363-1370' },
        { text: 'UNOS Policy 9.1: MELD-Na, 2016' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="bilirubin" label="総ビリルビン" unit="mg/dL" value={bilirubin} onChange={setBilirubin} min={0.1} max={50} step={0.1} />
        <NumberInput id="cr" label="血清クレアチニン" unit="mg/dL" value={cr} onChange={setCr} min={0.1} max={15} step={0.01} />
        <NumberInput id="inr" label="INR" unit="" value={inr} onChange={setInr} min={0.5} max={15} step={0.01} />
        <NumberInput id="na" label="血清Na" unit="mEq/L" value={na} onChange={setNa} min={100} max={160} step={0.1} />
        <RadioGroup label="透析（週2回以上）" name="dialysis" value={dialysis} onChange={setDialysis} options={[{ value: 'no', label: 'なし' }, { value: 'yes', label: 'あり（Crは4.0で計算）' }]} />
      </div>
    </CalculatorLayout>
  )
}
