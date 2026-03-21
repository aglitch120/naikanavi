'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('post-test-probability')!


export default function Page() {
  const [pretest, setPretest] = useState('50')
  const [lrPos, setLrPos] = useState('')
  const [lrNeg, setLrNeg] = useState('')

  const result = useMemo(() => {
    const pre = parseFloat(pretest)
    const pos = parseFloat(lrPos)
    const neg = parseFloat(lrNeg)
    if (!pre || pre <= 0 || pre >= 100) return null
    const preOdds = pre / (100 - pre)
    const results: any[] = []
    if (pos && pos > 0) {
      const postOdds = preOdds * pos
      const postProb = (postOdds / (1 + postOdds)) * 100
      results.push({ label: '検査陽性時', prob: postProb, lr: pos })
    }
    if (neg && neg > 0) {
      const postOdds = preOdds * neg
      const postProb = (postOdds / (1 + postOdds)) * 100
      results.push({ label: '検査陰性時', prob: postProb, lr: neg })
    }
    if (results.length === 0) return null
    return { pretest: pre, results }
  }, [pretest, lrPos, lrNeg])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn}
      description={toolDef.description} category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard label="検査後確率" value={result.results.map(r => `${r.label}: ${r.prob.toFixed(1)}%`).join(' / ')} interpretation="Fagan nomogram" severity="ok"
          details={[
            { label: '検査前確率', value: `${result.pretest}%` },
            ...result.results.map(r => ({ label: `${r.label}（LR=${r.lr}）`, value: `${r.prob.toFixed(1)}%` })),
            { label: '計算', value: '検査前オッズ × LR = 検査後オッズ → 確率に変換' },
          ]} />
      )}>
      <NumberInput id="f1" label="検査前確率 (%)" value={pretest} onChange={setPretest} min={0.1} max={99.9} step={1} />
      <NumberInput id="f2" label="陽性尤度比 (LR+)" value={lrPos} onChange={setLrPos} min={0} step={0.1} />
      <NumberInput id="f3" label="陰性尤度比 (LR-)" value={lrNeg} onChange={setLrNeg} min={0} max={1} step={0.01} />
    </CalculatorLayout>
  )
}

