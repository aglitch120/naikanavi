'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('iron-deficit')!


export default function Page() {
  const [weight, setWeight] = useState('60')
  const [actualHb, setActualHb] = useState('')
  const [targetHb, setTargetHb] = useState('13')

  const result = useMemo(() => {
    const w = parseFloat(weight), ah = parseFloat(actualHb), th = parseFloat(targetHb)
    if (!w || !ah || !th || w <= 0) return null
    // Ganzoni: deficit = weight × (target Hb - actual Hb) × 2.4 + iron stores(500mg)
    const deficit = w * (th - ah) * 2.4 + 500
    const ferinject = Math.ceil(deficit / 500) * 500 // カルボキシマルトース鉄は500mg単位
    return { deficit: Math.max(0, deficit), ferinject: Math.max(500, ferinject) }
  }, [weight, actualHb, targetHb])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn}
      description={toolDef.description} category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard label="鉄欠乏量" value={`${result.deficit.toFixed(0)} mg`} interpretation="Ganzoni formula" severity="ok"
          details={[
            { label: '計算式', value: '体重×(目標Hb-実Hb)×2.4 + 貯蔵鉄500mg' },
            { label: 'カルボキシマルトース鉄（フェインジェクト）', value: `${result.ferinject} mg` },
            { label: '含糖酸化鉄（フェジン）40mg/A', value: `${Math.ceil(result.deficit / 40)} A` },
          ]} />
      )}>
      <NumberInput id="f1" label="体重 (kg)" value={weight} onChange={setWeight} min={0} />
      <NumberInput id="f2" label="実測Hb (g/dL)" value={actualHb} onChange={setActualHb} min={0} step={0.1} />
      <NumberInput id="f3" label="目標Hb (g/dL)" value={targetHb} onChange={setTargetHb} min={0} step={0.1} />
      <p className="text-[11px] text-muted mt-2">目標Hb: 男性13 g/dL, 女性12 g/dL（一般的目安）</p>
    </CalculatorLayout>
  )
}

