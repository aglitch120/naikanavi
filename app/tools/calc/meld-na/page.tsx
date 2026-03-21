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
    const inrVal = parseFloat(inr)
    let naVal = parseFloat(na)
    if (!bil || !crVal || !inrVal || !naVal) return null

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
    if (meldNaCapped >= 30) interpretation = '3ヶ月死亡率 50%超 — 移植を積極的に検討'
    else if (meldNaCapped >= 20) interpretation = '3ヶ月死亡率 約20% — 移植待機リスト上位'
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
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">MELD-Naとは</h2>
          <p>MELDスコアに血清Naを組み込んだ改良版。低Na血症を伴う肝硬変患者の予後予測精度が向上します。2016年以降、米国の臓器移植ネットワーク（UNOS）で標準採用。</p>
          <p className="font-mono bg-bg p-2 rounded text-xs">MELD-Na = MELD + 1.32×(137−Na) − 0.033×MELD×(137−Na)</p>
          <h3 className="font-bold text-tx">MELDとの違い</h3>
          <p>低Na血症（希釈性）は門脈圧亢進症の重症度を反映し、肝硬変の予後不良因子。MELD単独では過小評価されるケースを補正します。</p>
        </section>
      }
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
