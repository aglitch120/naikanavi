'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('corrected-na-glucose')!
export default function CorrectedNaGlucosePage() {
  const [na, setNa] = useState('130')
  const [glu, setGlu] = useState('500')
  const result = useMemo(() => {
    const n = parseFloat(na), g = parseFloat(glu)
    if (!n || !g) return null
    const katz = n + 1.6 * (g - 100) / 100
    const hillier = n + 2.4 * (g - 100) / 100
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (katz < 135) severity = 'wn'
    if (katz < 130) severity = 'dn'
    return { katz: katz.toFixed(1), hillier: hillier.toFixed(1), severity }
  }, [na, glu])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity={result.severity}
        value={`補正Na = ${result.katz} mEq/L（Katz式）`}
        interpretation={`Hillier式: ${result.hillier} mEq/L\n\n• Katz式: +1.6 mEq/L per 血糖100mg/dL上昇\n• Hillier式: +2.4 mEq/L per 血糖100mg/dL上昇（血糖400以上ではこちら推奨）`} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">Katz式:</strong> 補正Na = 実測Na + 1.6 × (血糖 - 100) / 100</p><p><strong className="text-tx">Hillier式:</strong> 補正Na = 実測Na + 2.4 × (血糖 - 100) / 100</p><p>高血糖による浸透圧移動で見かけ上Naが低下する。DKA/HHS管理に必須。</p></div>}
      relatedTools={[{ slug: 'na-deficit', name: 'Na欠乏量' }, { slug: 'na-correction-rate', name: 'Na補正速度' }, { slug: 'plasma-osmolality', name: '血漿浸透圧' }]}
      references={toolDef.sources || []}
    >
      <NumberInput label="実測Na (mEq/L)" value={na} onChange={setNa} />
      <NumberInput label="血糖値 (mg/dL)" value={glu} onChange={setGlu} />
    </CalculatorLayout>
  )
}
