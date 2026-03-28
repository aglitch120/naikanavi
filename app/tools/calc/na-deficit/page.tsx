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
  const [weight, setWeight] = useState('60')
  const [currentNa, setCurrentNa] = useState('125')
  const [targetNa, setTargetNa] = useState('130')

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
      slug={toolDef.slug}
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <div className="space-y-2">
          <ResultCard
            label="Na補充必要量"
            value={result.deficit}
            unit="mEq"
            interpretation="⚠️ 最大10 mEq/L以下（推奨目標は6-8 mEq/L/日）。ODS予防"
            severity="wn"
            details={[
              { label: 'TBW', value: `${result.tbw} L` },
              { label: 'Na上昇幅', value: `${result.delta} mEq/L` },
              { label: '3% NaCl換算', value: `約${result.threePercentNaCl} mL` },
            ]}
          />
          <p className="text-[10px] text-wn px-1">※推定値。実際の投与量・速度は繰り返しのNa測定と臨床状態を考慮して決定</p>
        </div>
      )}
      explanation={undefined}
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
        <p className="text-[10px] text-wn">※高齢者(男性0.5/女性0.45)や肥満患者ではTBW比が異なる。実際の補正速度はモニタリングしながら調整。</p>
        <NumberInput id="weight" label="体重" unit="kg" value={weight} onChange={setWeight} min={1} max={300} step={0.1} />
        <NumberInput id="currentNa" label="現在のNa" unit="mEq/L" value={currentNa} onChange={setCurrentNa} min={100} max={170} step={0.1} />
        <NumberInput id="targetNa" label="目標Na" unit="mEq/L" value={targetNa} onChange={setTargetNa} min={100} max={170} step={0.1} />
      </div>
    </CalculatorLayout>
  )
}
