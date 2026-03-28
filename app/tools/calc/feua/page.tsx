'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('feua')!

export default function FeuaPage() {
  const [uUA, setUUA] = useState('30')
  const [sUA, setSUA] = useState('6.0')
  const [uCr, setUCr] = useState('100')
  const [sCr, setSCr] = useState('1.0')

  const result = useMemo(() => {
    const uua = parseFloat(uUA), sua = parseFloat(sUA), uc = parseFloat(uCr), sc = parseFloat(sCr)
    if (!uua || !sua || !uc || !sc) return null
    const feua = (uua * sc) / (sua * uc) * 100
    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (feua < 5) {
      interpretation = 'FEUA < 5% — 尿酸排泄低下（腎前性AKI・volume depletion・利尿薬使用）'
      severity = 'wn'
    } else if (feua <= 11) {
      interpretation = 'FEUA 5〜11% — 正常範囲'
    } else {
      interpretation = 'FEUA > 11% — 尿酸排泄亢進。SIADH（Maesaka 1998: >11%）の鑑別に有用'
      severity = 'dn'
    }
    return { feua: feua.toFixed(2), severity, interpretation }
  }, [uUA, sUA, uCr, sCr])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity={result.severity} value={`FEUA = ${result.feua}%`} interpretation={result.interpretation} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">計算式:</strong> FEUA = (尿UA × 血清Cr) / (血清UA × 尿Cr) × 100</p><p><strong className="text-tx">臨床的意義:</strong> 低Na血症の鑑別でSIADH（FEUA&gt;11%）とvolume depletion（FEUA&lt;7%）の区別に有用。FENaより利尿薬の影響を受けにくい。</p></div>}
      relatedTools={[{ slug: 'fena', name: 'FENa' }, { slug: 'fek', name: 'FEK' }, { slug: 'siadh', name: 'SIADH診断基準' }]}
      references={toolDef.sources || []}
    >
      <NumberInput label="尿中UA (mg/dL)" value={uUA} onChange={setUUA} />
      <NumberInput label="血清UA (mg/dL)" value={sUA} onChange={setSUA} step={0.1} />
      <NumberInput label="尿中Cr (mg/dL)" value={uCr} onChange={setUCr} />
      <NumberInput label="血清Cr (mg/dL)" value={sCr} onChange={setSCr} step={0.1} />
    </CalculatorLayout>
  )
}
