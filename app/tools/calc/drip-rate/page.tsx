'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('drip-rate')!


export default function Page() {
  const [volume, setVolume] = useState('500')
  const [hours, setHours] = useState('6')
  const [dropFactor, setDropFactor] = useState('20')

  const result = useMemo(() => {
    const v = parseFloat(volume), h = parseFloat(hours), d = parseFloat(dropFactor)
    if (!v || !h || !d || h <= 0) return null
    const mlPerHour = v / h
    const dropsPerMin = (v * d) / (h * 60)
    return { mlPerHour, dropsPerMin }
  }, [volume, hours, dropFactor])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn}
      description={toolDef.description} category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard label="点滴速度" value={`${result.mlPerHour.toFixed(1)} mL/h`} interpretation={`${result.dropsPerMin.toFixed(1)} 滴/分`} severity="ok"
          details={[
            { label: 'mL/時間', value: result.mlPerHour.toFixed(1) },
            { label: '滴/分', value: result.dropsPerMin.toFixed(1) },
            { label: '滴係数', value: dropFactor + ' 滴/mL' },
          ]} />
      )}>
      <NumberInput id="f1" label="総輸液量 (mL)" value={volume} onChange={setVolume} min={0} step={50} />
      <NumberInput id="f2" label="投与時間 (時間)" value={hours} onChange={setHours} min={0} step={0.5} />
      <NumberInput id="f3" label="滴係数 (滴/mL)" value={dropFactor} onChange={setDropFactor} min={1} step={1} />
      <p className="text-[11px] text-muted mt-2">一般輸液セット: 20滴/mL、小児用/微量: 60滴/mL</p>
    </CalculatorLayout>
  )
}

