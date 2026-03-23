'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('femg')!
export default function FemgPage() {
  const [uMg, setUMg] = useState('5')
  const [sMg, setSMg] = useState('1.8')
  const [uCr, setUCr] = useState('100')
  const [sCr, setSCr] = useState('1.0')
  const result = useMemo(() => {
    const umg = parseFloat(uMg), smg = parseFloat(sMg), uc = parseFloat(uCr), sc = parseFloat(sCr)
    if (!umg || !smg || !uc || !sc) return null
    const femg = (umg * sc) / (0.7 * smg * uc) * 100
    let interpretation = '', severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (femg < 2) { interpretation = 'FEMg < 2% — 腎外性Mg喪失（消化管喪失等）'; severity = 'wn' }
    else if (femg <= 4) { interpretation = 'FEMg 2〜4% — 境界域'; severity = 'wn' }
    else { interpretation = 'FEMg > 4% — 腎性Mg喪失（利尿薬・尿細管障害・薬剤性等）'; severity = 'dn' }
    return { femg: femg.toFixed(2), severity, interpretation }
  }, [uMg, sMg, uCr, sCr])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity={result.severity} value={`FEMg = ${result.femg}%`} interpretation={result.interpretation} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">計算式:</strong> FEMg = (尿Mg × 血清Cr) / (0.7 × 血清Mg × 尿Cr) × 100</p><p>0.7は蛋白結合分を補正するため。遊離Mgのみが糸球体濾過される。</p><p><strong className="text-tx">低Mg血症:</strong> FEMg &gt;4% → 腎性喪失（PPI・ループ利尿薬・シスプラチン・アルコール等）</p></div>}
      relatedTools={[{ slug: 'fena', name: 'FENa' }, { slug: 'fek', name: 'FEK' }]}
      references={toolDef.sources || []}
    >
      <NumberInput label="尿中Mg (mg/dL)" value={uMg} onChange={setUMg} step="0.1" />
      <NumberInput label="血清Mg (mg/dL)" value={sMg} onChange={setSMg} step="0.1" />
      <NumberInput label="尿中Cr (mg/dL)" value={uCr} onChange={setUCr} />
      <NumberInput label="血清Cr (mg/dL)" value={sCr} onChange={setSCr} step="0.1" />
    </CalculatorLayout>
  )
}
