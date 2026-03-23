'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('insensible-loss')!
export default function InsensibleLossPage() {
  const [weight, setWeight] = useState('60')
  const [temp, setTemp] = useState('37.0')
  const result = useMemo(() => {
    const w = parseFloat(weight), t = parseFloat(temp)
    if (!w) return null
    const base = 15 * w // 約15 mL/kg/日
    const feverFactor = t > 37 ? Math.pow(1.15, t - 37) : 1
    const total = base * feverFactor
    const perHour = total / 24
    return { base: base.toFixed(0), total: total.toFixed(0), perHour: perHour.toFixed(0), feverFactor: feverFactor.toFixed(2) }
  }, [weight, temp])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity="ok"
        value={`不感蒸泄 ≒ ${result.total} mL/日`}
        interpretation={`≒ ${result.perHour} mL/時\n\n基礎量: ${result.base} mL/日 (15 mL/kg)\n発熱補正係数: ×${result.feverFactor}\n\n※ 発汗は含まれない。発汗著明な場合はさらに追加が必要。`} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">計算式:</strong> 不感蒸泄 = 15 mL/kg/日 × 1.15^(体温-37)</p><p>皮膚(2/3)と呼気(1/3)からの水分喪失。体温1℃上昇ごとに約15%増加。</p><p>人工呼吸中は呼気からの蒸泄が減少（加温加湿回路使用時）。</p></div>}
      relatedTools={[{ slug: 'maintenance-fluid', name: '維持輸液量' }, { slug: 'holiday-segar', name: 'Holiday-Segar' }, { slug: 'free-water-deficit', name: '自由水欠乏量' }]}
      references={toolDef.sources || []}
    >
      <NumberInput label="体重 (kg)" value={weight} onChange={setWeight} />
      <NumberInput label="体温 (℃)" value={temp} onChange={setTemp} step="0.1" />
    </CalculatorLayout>
  )
}
