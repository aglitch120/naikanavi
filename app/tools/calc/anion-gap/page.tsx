'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('anion-gap')!

export default function AnionGapPage() {
  const [na, setNa] = useState('')
  const [cl, setCl] = useState('')
  const [hco3, setHco3] = useState('')
  const [alb, setAlb] = useState('')

  const result = useMemo(() => {
    const naVal = parseFloat(na)
    const clVal = parseFloat(cl)
    const hco3Val = parseFloat(hco3)
    if (!naVal || !clVal || isNaN(hco3Val)) return null

    const ag = naVal - clVal - hco3Val
    const albVal = parseFloat(alb)
    const correctedAg = !isNaN(albVal) && albVal > 0 ? ag + 2.5 * (4.0 - albVal) : null
    const deltaAg = ag - 12
    const deltaHco3 = 24 - hco3Val
    const deltaRatio = deltaHco3 !== 0 ? deltaAg / deltaHco3 : null

    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    const effectiveAg = correctedAg ?? ag

    if (effectiveAg > 16) {
      interpretation = 'AG開大型代謝性アシドーシス'
      severity = 'dn'
    } else if (effectiveAg > 12) {
      interpretation = 'AG軽度上昇 — 臨床的に再評価を'
      severity = 'wn'
    } else if (effectiveAg < 6) {
      interpretation = 'AG低下 — 低Alb・Li中毒・多発性骨髄腫等を考慮'
      severity = 'wn'
    } else {
      interpretation = '正常AG'
      severity = 'ok'
    }

    return { ag, correctedAg, deltaRatio, interpretation, severity }
  }, [na, cl, hco3, alb])

  return (
    <CalculatorLayout
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard
          label="アニオンギャップ"
          value={result.ag.toFixed(1)}
          unit="mEq/L"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            ...(result.correctedAg != null ? [{ label: '補正AG（Alb補正）', value: `${result.correctedAg.toFixed(1)} mEq/L` }] : []),
            ...(result.deltaRatio != null ? [{ label: 'ΔAG/ΔHCO₃⁻', value: result.deltaRatio.toFixed(2) }] : []),
            { label: '正常範囲', value: '8〜12 mEq/L' },
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">アニオンギャップ（AG）とは</h2>
          <p>AGは血漿中の測定されない陰イオンの指標で、代謝性アシドーシスの鑑別に不可欠です。</p>
          <p className="font-mono bg-bg p-2 rounded text-xs">AG = Na⁺ − Cl⁻ − HCO₃⁻（正常: 8〜12 mEq/L）</p>
          <p className="font-mono bg-bg p-2 rounded text-xs mt-1">補正AG = AG + 2.5 ×（4.0 − Alb）</p>
          <h3 className="font-bold text-tx">AG開大の鑑別（MUDPILES）</h3>
          <p>Methanol, Uremia, DKA, Propylene glycol, Isoniazid/Iron, Lactic acidosis, Ethylene glycol, Salicylates</p>
          <h3 className="font-bold text-tx">ΔAG/ΔHCO₃⁻ 比</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>&lt;1: 非AG開大型アシドーシスの合併</li>
            <li>1〜2: 純粋なAG開大型アシドーシス</li>
            <li>&gt;2: 代謝性アルカローシスの合併</li>
          </ul>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Emmett M, Narins RG. Medicine 1977;56:38-54' },
        { text: 'Figge J et al. Crit Care Med 1998;26:1807-1810' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="na" label="Na⁺" unit="mEq/L" value={na} onChange={setNa} min={100} max={180} step={0.1} />
        <NumberInput id="cl" label="Cl⁻" unit="mEq/L" value={cl} onChange={setCl} min={60} max={140} step={0.1} />
        <NumberInput id="hco3" label="HCO₃⁻" unit="mEq/L" value={hco3} onChange={setHco3} min={1} max={50} step={0.1} />
        <NumberInput id="alb" label="アルブミン（任意）" unit="g/dL" hint="入力するとAlb補正AGを計算" value={alb} onChange={setAlb} min={0.1} max={6} step={0.1} />
      </div>
    </CalculatorLayout>
  )
}
