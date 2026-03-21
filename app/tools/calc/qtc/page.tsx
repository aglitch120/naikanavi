'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('qtc')!

export default function QtcPage() {
  const [qt, setQt] = useState('400')
  const [hr, setHr] = useState('75')
  const [sex, setSex] = useState('male')

  const result = useMemo(() => {
    const qtVal = parseFloat(qt)
    const hrVal = parseFloat(hr)
    if (!qtVal || !hrVal || hrVal <= 0) return null

    const rr = 60 / hrVal
    const bazett = qtVal / Math.sqrt(rr)
    const fridericia = qtVal / Math.cbrt(rr)

    const upperLimit = sex === 'male' ? 450 : 470
    const severity: 'ok' | 'wn' | 'dn' =
      bazett >= 500 ? 'dn' : bazett >= upperLimit ? 'wn' : 'ok'

    let interpretation = ''
    if (bazett >= 500) interpretation = 'QTc著明延長 — TdPリスク高。原因薬剤の中止・電解質補正を'
    else if (bazett >= upperLimit) interpretation = `QTc延長（${sex === 'male' ? '男性' : '女性'}基準）— 原因検索を`
    else if (bazett < 350) interpretation = 'QTc短縮 — Short QT syndromeを考慮'
    else interpretation = 'QTc正常範囲'

    return { bazett: Math.round(bazett), fridericia: Math.round(fridericia), severity, interpretation, upperLimit }
  }, [qt, hr, sex])

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
          label="QTc (Bazett)"
          value={result.bazett}
          unit="ms"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: 'QTc (Fridericia)', value: `${result.fridericia} ms` },
            { label: '正常上限', value: `${result.upperLimit} ms（${sex === 'male' ? '男性' : '女性'}）` },
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">QTc（補正QT間隔）とは</h2>
          <p>QT間隔は心室の脱分極から再分極までの時間で、心拍数に依存します。QTcは心拍数による影響を補正した値です。</p>
          <p className="font-mono bg-bg p-2 rounded text-xs">Bazett: QTc = QT / √RR</p>
          <p className="font-mono bg-bg p-2 rounded text-xs mt-1">Fridericia: QTc = QT / ∛RR</p>
          <h3 className="font-bold text-tx">QTc延長の主な原因</h3>
          <p>抗不整脈薬（Ia, III群）、抗菌薬（マクロライド、フルオロキノロン）、抗精神病薬、低K・低Mg・低Ca、先天性QT延長症候群</p>
          <h3 className="font-bold text-tx">臨床的意義</h3>
          <p>QTc ≥ 500msではTorsades de Pointes（TdP）のリスクが有意に上昇。HR 60-100の範囲ではBazett式が標準ですが、頻脈・徐脈ではFridericia式がより正確とされます。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Bazett HC. Heart 1920;7:353-370' },
        { text: 'Fridericia LS. Acta Med Scand 1920;53:469-486' },
        { text: 'Rautaharju PM, et al. Circulation 2009;119:e241-e250' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="qt" label="QT間隔" unit="ms" value={qt} onChange={setQt} min={200} max={800} step={1} />
        <NumberInput id="hr" label="心拍数" unit="bpm" value={hr} onChange={setHr} min={20} max={250} step={1} />
        <RadioGroup label="性別" name="sex" value={sex} onChange={setSex} options={[{ value: 'male', label: '男性' }, { value: 'female', label: '女性' }]} />
      </div>
    </CalculatorLayout>
  )
}
