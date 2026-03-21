'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('delta-gap')!


export default function Page() {
  const [na, setNa] = useState('')
  const [cl, setCl] = useState('')
  const [hco3, setHco3] = useState('')
  const [albumin, setAlbumin] = useState('4.0')

  const result = useMemo(() => {
    const n = parseFloat(na), c = parseFloat(cl), h = parseFloat(hco3), a = parseFloat(albumin)
    if (!n || !c || !h) return null
    const normalAG = 12
    const correctedAG = a ? (n - c - h) + 2.5 * (4.0 - a) : (n - c - h)
    const deltaAG = correctedAG - normalAG
    const deltaHCO3 = 24 - h
    const ratio = deltaHCO3 !== 0 ? deltaAG / deltaHCO3 : 0
    let label = ''
    let sev: 'ok' | 'wn' | 'dn' = 'ok'
    if (ratio < 1) { label = 'AG上昇 + 非AG性代謝性アシドーシスの合併'; sev = 'dn' }
    else if (ratio <= 2) { label = '純粋なAG上昇型代謝性アシドーシス'; sev = 'wn' }
    else { label = 'AG上昇 + 代謝性アルカローシスの合併'; sev = 'wn' }
    return { correctedAG, deltaAG, deltaHCO3, ratio, label, sev }
  }, [na, cl, hco3, albumin])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn}
      description={toolDef.description} category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard label="Delta ratio" value={result.ratio.toFixed(2)} interpretation={result.label} severity={result.sev}
          details={[
            { label: '補正AG', value: result.correctedAG.toFixed(1) },
            { label: 'ΔAG', value: result.deltaAG.toFixed(1) },
            { label: 'ΔHCO3', value: result.deltaHCO3.toFixed(1) },
            { label: '<1', value: '非AG性アシドーシス合併' },
            { label: '1-2', value: '純粋なAG上昇型アシドーシス' },
            { label: '>2', value: '代謝性アルカローシス合併' },
          ]} />
      )}>
      <NumberInput id="f1" label="Na (mEq/L)" value={na} onChange={setNa} min={0} />
      <NumberInput id="f2" label="Cl (mEq/L)" value={cl} onChange={setCl} min={0} />
      <NumberInput id="f3" label="HCO3 (mEq/L)" value={hco3} onChange={setHco3} min={0} step={0.1} />
      <NumberInput id="f4" label="Alb (g/dL) ※補正用" value={albumin} onChange={setAlbumin} min={0} step={0.1} />
    </CalculatorLayout>
  )
}

