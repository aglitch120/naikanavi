'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('free-water-deficit')!

export default function FreeWaterDeficitPage() {
  const [sex, setSex] = useState('male')
  const [weight, setWeight] = useState('')
  const [currentNa, setCurrentNa] = useState('')

  const result = useMemo(() => {
    const w = parseFloat(weight)
    const na = parseFloat(currentNa)
    if (!w || !na || na <= 140) return null

    const tbwFactor = sex === 'male' ? 0.6 : 0.5
    const tbw = w * tbwFactor
    const deficit = tbw * ((na / 140) - 1)

    return {
      deficit: deficit.toFixed(1),
      tbw: tbw.toFixed(1),
    }
  }, [sex, weight, currentNa])

  return (
    <CalculatorLayout
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard
          label="自由水欠乏量"
          value={result.deficit}
          unit="L"
          interpretation="⚠️ 24時間で10 mEq/L以下のNa低下に留める"
          severity="wn"
          details={[
            { label: 'TBW', value: `${result.tbw} L` },
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">自由水欠乏量とは</h2>
          <p>高ナトリウム血症（Na &gt; 145 mEq/L）における自由水の不足量を計算します。</p>
          <p className="font-mono bg-bg p-2 rounded text-xs">自由水欠乏量(L) = TBW × (現在Na/140 − 1)</p>
          <h3 className="font-bold text-tx">補正の原則</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Na低下速度: 24時間で10 mEq/L以下</li>
            <li>最初の24時間で欠乏量の半分を補正</li>
            <li>残りを次の24〜48時間で補正</li>
            <li>5%ブドウ糖液（自由水）or 経口水分摂取で補正</li>
          </ul>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Adrogué HJ, Madias NE. N Engl J Med 2000;342:1493-1499' },
      ]}
    >
      <div className="space-y-4">
        <RadioGroup name="sex" label="性別" value={sex} onChange={setSex} options={[{ value: 'male', label: '男性' }, { value: 'female', label: '女性' }]} />
        <NumberInput id="weight" label="体重" unit="kg" value={weight} onChange={setWeight} min={1} max={300} step={0.1} />
        <NumberInput id="currentNa" label="現在のNa" unit="mEq/L" hint="高Na血症（>145）の場合に使用" value={currentNa} onChange={setCurrentNa} min={100} max={200} step={0.1} />
      </div>
    </CalculatorLayout>
  )
}
