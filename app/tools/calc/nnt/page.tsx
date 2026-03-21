'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('nnt')!


export default function Page() {
  const [cer, setCer] = useState('')
  const [eer, setEer] = useState('')

  const result = useMemo(() => {
    const c = parseFloat(cer), e = parseFloat(eer)
    if (c === undefined || e === undefined || isNaN(c) || isNaN(e)) return null
    const cRate = c / 100, eRate = e / 100
    const arr = cRate - eRate
    const rrr = arr / cRate
    if (arr === 0) return null
    const nnt = 1 / Math.abs(arr)
    const isHarm = arr < 0
    return { nnt, arr: arr * 100, rrr: rrr * 100, isHarm }
  }, [cer, eer])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn}
      description={toolDef.description} category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard label={result.isHarm ? "NNH" : "NNT"} value={result.nnt.toFixed(1)} interpretation={result.isHarm ? '治療による有害必要数' : '治療必要例数'} severity={result.isHarm ? 'dn' : 'ok'}
          details={[
            { label: 'ARR（絶対リスク差）', value: `${result.arr.toFixed(2)}%` },
            { label: 'RRR（相対リスク減少）', value: `${result.rrr.toFixed(1)}%` },
            { label: '解釈', value: result.isHarm ? `${result.nnt.toFixed(0)}人治療で1人に害` : `${result.nnt.toFixed(0)}人治療で1人がイベント回避` },
          ]} />
      )}>
      <NumberInput id="f1" label="対照群イベント発生率 CER (%)" value={cer} onChange={setCer} min={0} max={100} step={0.1} />
      <NumberInput id="f2" label="治療群イベント発生率 EER (%)" value={eer} onChange={setEer} min={0} max={100} step={0.1} />
    </CalculatorLayout>
  )
}

