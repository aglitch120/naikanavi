'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('tidal-volume')!
export default function TidalVolumePage() {
  const [height, setHeight] = useState('170')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const result = useMemo(() => {
    const h = parseFloat(height)
    if (!h) return null
    const pbw = sex === 'male' ? 50 + 0.91 * (h - 152.4) : 45.5 + 0.91 * (h - 152.4)
    const tv6 = pbw * 6, tv8 = pbw * 8
    return { pbw: pbw.toFixed(1), tv6: tv6.toFixed(0), tv8: tv8.toFixed(0) }
  }, [height, sex])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity="ok"
        value={`TV = ${result.tv6}〜${result.tv8} mL`}
        interpretation={`予測体重(PBW) = ${result.pbw} kg\n6 mL/kg = ${result.tv6} mL\n8 mL/kg = ${result.tv8} mL\n\nARDSでは6 mL/kg以下を目標。プラトー圧 ≦30 cmH₂Oを確認。`} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">予測体重(PBW):</strong></p><p>男性: 50 + 0.91 × (身長cm - 152.4)</p><p>女性: 45.5 + 0.91 × (身長cm - 152.4)</p><p>実体重ではなく予測体重を使用。肥満患者で過大な一回換気量にならないよう注意。</p></div>}
      relatedTools={[{ slug: 'ibw', name: '理想体重(IBW)' }, { slug: 'pf-ratio', name: 'P/F比' }, { slug: 'oxygen-delivery', name: '酸素運搬量' }]}
      references={toolDef.sources || []}
    >
      <div className="flex gap-2 mb-2">
        <button onClick={() => setSex('male')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${sex === 'male' ? 'bg-ac text-white' : 'bg-s1 text-muted'}`}>男性</button>
        <button onClick={() => setSex('female')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${sex === 'female' ? 'bg-ac text-white' : 'bg-s1 text-muted'}`}>女性</button>
      </div>
      <NumberInput label="身長 (cm)" value={height} onChange={setHeight} />
    </CalculatorLayout>
  )
}
