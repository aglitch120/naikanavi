'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('ibw')!

export default function IbwPage() {
  const [height, setHeight] = useState('170')
  const [weight, setWeight] = useState('78')
  const [sex, setSex] = useState('male')

  const result = useMemo(() => {
    const h = parseFloat(height)
    const w = parseFloat(weight)
    if (!h || h < 100) return null

    const hInch = h / 2.54
    // Devine式
    const ibw = sex === 'male'
      ? 50 + 2.3 * (hInch - 60)
      : 45.5 + 2.3 * (hInch - 60)

    const abw = ibw + 0.4 * ((w || ibw) - ibw)
    const tvRange6 = (ibw * 6 / 1000).toFixed(2)
    const tvRange8 = (ibw * 8 / 1000).toFixed(2)

    const pctIbw = w ? ((w / ibw) * 100).toFixed(0) : null
    const isObese = w ? w > ibw * 1.2 : false

    return {
      ibw: ibw.toFixed(1),
      abw: abw.toFixed(1),
      tvRange6,
      tvRange8,
      pctIbw,
      isObese,
    }
  }, [height, weight, sex])

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
          label="理想体重（IBW）"
          value={result.ibw}
          unit="kg"
          interpretation={result.isObese ? '実体重 > IBW×120% — 調整体重（ABW）を使用' : '実体重はIBW近傍 — IBWで投与量計算'}
          severity="neutral"
          details={[
            { label: '調整体重（ABW）', value: `${result.abw} kg` },
            ...(result.pctIbw ? [{ label: '実体重/IBW比', value: `${result.pctIbw}%` }] : []),
            { label: 'TV目安（6-8 mL/kg IBW）', value: `${result.tvRange6}〜${result.tvRange8} L` },
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">理想体重（IBW）と調整体重（ABW）</h2>
          <p>IBW（Devine式）は身長に基づく体重推定値。人工呼吸器の一回換気量（6-8 mL/kg IBW）やアミノグリコシド等の薬物投与量計算に使用します。</p>
          <p className="font-mono bg-bg p-2 rounded text-xs">男性: IBW = 50 + 2.3 × (身長inch − 60)</p>
          <p className="font-mono bg-bg p-2 rounded text-xs mt-1">女性: IBW = 45.5 + 2.3 × (身長inch − 60)</p>
          <p className="font-mono bg-bg p-2 rounded text-xs mt-1">ABW = IBW + 0.4 × (実体重 − IBW)</p>
          <h3 className="font-bold text-tx">使い分け</h3>
          <p>実体重がIBWの120%未満 → IBWを使用。120%以上（肥満）→ ABWを使用（バンコマイシン等の親水性薬剤）。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Devine BJ. Drug Intell Clin Pharm 1974;8:568-570' },
        { text: 'ARDSNet. NEJM 2000;342:1301-1308' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="height" label="身長" unit="cm" value={height} onChange={setHeight} min={100} max={250} step={0.1} />
        <NumberInput id="weight" label="実体重（任意）" unit="kg" hint="入力するとABWと%IBWを計算" value={weight} onChange={setWeight} min={20} max={300} step={0.1} />
        <RadioGroup label="性別" name="sex" value={sex} onChange={setSex} options={[{ value: 'male', label: '男性' }, { value: 'female', label: '女性' }]} />
      </div>
    </CalculatorLayout>
  )
}
