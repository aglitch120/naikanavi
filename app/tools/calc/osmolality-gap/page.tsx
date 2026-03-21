'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('osmolality-gap')!

export default function OsmolalityGapPage() {
  const [measuredOsm, setMeasuredOsm] = useState('310')
  const [na, setNa] = useState('140')
  const [glucose, setGlucose] = useState('100')
  const [bun, setBun] = useState('20')

  const result = useMemo(() => {
    const mOsm = parseFloat(measuredOsm)
    const naVal = parseFloat(na)
    const glu = parseFloat(glucose)
    const bunVal = parseFloat(bun)
    if (!mOsm || !naVal || !glu || !bunVal) return null

    const calcOsm = 2 * naVal + glu / 18 + bunVal / 2.8
    const gap = mOsm - calcOsm

    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (gap > 25) {
      interpretation = 'OG著明開大 — メタノール・エチレングリコール中毒を強く疑う'
      severity = 'dn'
    } else if (gap > 10) {
      interpretation = 'OG開大 — 中毒物質・エタノール・その他の浸透圧物質を検索'
      severity = 'wn'
    } else if (gap < -10) {
      interpretation = 'OG低値 — 測定誤差・高脂血症・高蛋白血症を考慮'
      severity = 'wn'
    } else {
      interpretation = '浸透圧ギャップ正常（-10〜+10）'
    }

    return { gap: gap.toFixed(1), calcOsm: calcOsm.toFixed(0), severity, interpretation }
  }, [measuredOsm, na, glucose, bun])

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
          label="浸透圧ギャップ"
          value={result.gap}
          unit="mOsm/kg"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: '計算浸透圧', value: `${result.calcOsm} mOsm/kg` },
            { label: '正常範囲', value: '-10〜+10' },
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">浸透圧ギャップ（Osmolal Gap）とは</h2>
          <p>実測浸透圧と計算浸透圧の差。通常は-10〜+10 mOsm/kg。開大は血中に測定されない浸透圧物質の存在を示唆します。</p>
          <p className="font-mono bg-bg p-2 rounded text-xs">計算浸透圧 = 2×Na + Glu/18 + BUN/2.8</p>
          <p className="font-mono bg-bg p-2 rounded text-xs mt-1">浸透圧ギャップ = 実測浸透圧 − 計算浸透圧</p>
          <h3 className="font-bold text-tx">OG開大の鑑別</h3>
          <p>メタノール、エチレングリコール、イソプロパノール、エタノール、プロピレングリコール、マンニトール</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Purssell RA, et al. J Toxicol Clin Toxicol 2001;39:255-260' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="measuredOsm" label="実測浸透圧" unit="mOsm/kg" value={measuredOsm} onChange={setMeasuredOsm} min={200} max={500} step={1} />
        <NumberInput id="na" label="血清Na" unit="mEq/L" value={na} onChange={setNa} min={100} max={180} step={0.1} />
        <NumberInput id="glucose" label="血糖" unit="mg/dL" value={glucose} onChange={setGlucose} min={10} max={1500} step={1} />
        <NumberInput id="bun" label="BUN" unit="mg/dL" value={bun} onChange={setBun} min={1} max={200} step={0.1} />
      </div>
    </CalculatorLayout>
  )
}
