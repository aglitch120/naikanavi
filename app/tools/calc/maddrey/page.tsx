'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('maddrey')!


export default function Page() {
  const [pt, setPt] = useState('')
  const [ptControl, setPtControl] = useState('12')
  const [bilirubin, setBilirubin] = useState('')

  const result = useMemo(() => {
    const p = parseFloat(pt), pc = parseFloat(ptControl), b = parseFloat(bilirubin)
    if (!p || !pc || !b) return null
    const mdf = 4.6 * (p - pc) + b
    const sev = mdf >= 32 ? 'dn' as const : 'ok' as const
    const label = mdf >= 32 ? '重症 — ステロイド治療の適応' : '非重症'
    return { mdf, sev, label }
  }, [pt, ptControl, bilirubin])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn}
      description={toolDef.description} category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard label="Maddrey DF" value={result.mdf.toFixed(1)} interpretation={result.label} severity={result.sev}
          details={[
            { label: '≧32', value: '重症: プレドニゾロン 40mg/日×28日 or ペンタキシフィリン' },
            { label: '<32', value: '支持療法' },
            { label: 'Lille model', value: '治療7日後に再評価（>0.45で無効）' },
          ]} />
      )}>
      <NumberInput id="f1" label="PT秒 (患者)" value={pt} onChange={setPt} min={0} step={0.1} />
      <NumberInput id="f2" label="PT秒 (コントロール)" value={ptControl} onChange={setPtControl} min={0} step={0.1} />
      <NumberInput id="f3" label="総ビリルビン (mg/dL)" value={bilirubin} onChange={setBilirubin} min={0} step={0.1} />
    </CalculatorLayout>
  )
}

