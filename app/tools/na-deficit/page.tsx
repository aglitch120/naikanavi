'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('na-deficit')!

function getTBWfactor(sex: string): number {
  return sex === 'male' ? 0.6 : 0.5
}

export default function NaDeficitPage() {
  const [sex, setSex] = useState('male')
  const [weight, setWeight] = useState('')
  const [currentNa, setCurrentNa] = useState('')
  const [targetNa, setTargetNa] = useState('135')

  const result = useMemo(() => {
    const w = parseFloat(weight)
    const cur = parseFloat(currentNa)
    const tar = parseFloat(targetNa)
    if (!w || !cur || !tar || cur >= tar) return null

    const tbw = w * getTBWfactor(sex)
    const deficit = tbw * (tar - cur)
    const threePercentNaCl = deficit / 513 * 1000 // 3% NaCl = 513 mEq/L

    return {
      deficit: deficit.toFixed(0),
      tbw: tbw.toFixed(1),
      threePercentNaCl: threePercentNaCl.toFixed(0),
      delta: tar - cur,
    }
  }, [sex, weight, currentNa, targetNa])

  return (
    <CalculatorLayout
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard
          score={`${result.deficit} mEq`}
          label="Na補充必要量"
          severity="wn"
          details={[
            `総体液量（TBW）: ${result.tbw} L`,
            `Na上昇幅: ${result.delta} mEq/L`,
            `3% NaCl換算: 約${result.threePercentNaCl} mL`,
            '⚠️ Na補正速度: 24時間で10 mEq/L以下（ODS予防）',
            '⚠️ 急性症候性低Na血症でも最初の数時間は4-6 mEq/L以内の補正に留める',
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">Na欠乏量の計算</h2>
          <p className="font-mono bg-bg p-2 rounded text-xs">Na欠乏量(mEq) = TBW × (目標Na − 現在Na)</p>
          <p className="font-mono bg-bg p-2 rounded text-xs mt-1">TBW = 体重 × 0.6（男性）or 0.5（女性）</p>
          <h3 className="font-bold text-tx">Na補正の注意点</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>24時間で10 mEq/L以下の補正（ODS予防）</li>
            <li>高リスク患者（低K、アルコール多飲、低栄養）: 8 mEq/L以下</li>
            <li>急性（48時間以内）低Na血症: より迅速な補正が許容される場合あり</li>
            <li>頻回のNa測定（4-6時間ごと）で速度を監視</li>
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
        { text: 'Sterns RH. N Engl J Med 2015;372:55-65' },
        { text: 'Verbalis JG et al. Am J Med 2013;126:S1-S42' },
      ]}
    >
      <div className="space-y-4">
        <RadioGroup name="sex" label="性別" value={sex} onChange={setSex} options={[{ value: 'male', label: '男性（TBW係数0.6）' }, { value: 'female', label: '女性（TBW係数0.5）' }]} />
        <NumberInput id="weight" label="体重" unit="kg" value={weight} onChange={setWeight} min={1} max={300} step={0.1} />
        <NumberInput id="currentNa" label="現在のNa" unit="mEq/L" value={currentNa} onChange={setCurrentNa} min={100} max={170} step={0.1} />
        <NumberInput id="targetNa" label="目標Na" unit="mEq/L" value={targetNa} onChange={setTargetNa} min={100} max={170} step={0.1} />
      </div>
    </CalculatorLayout>
  )
}
