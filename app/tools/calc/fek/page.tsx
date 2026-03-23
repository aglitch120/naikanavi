'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('fek')!

export default function FekPage() {
  const [uK, setUK] = useState('30')
  const [sK, setSK] = useState('4.0')
  const [uCr, setUCr] = useState('100')
  const [sCr, setSCr] = useState('1.0')

  const result = useMemo(() => {
    const uk = parseFloat(uK), sk = parseFloat(sK), uc = parseFloat(uCr), sc = parseFloat(sCr)
    if (!uk || !sk || !uc || !sc) return null
    const fek = (uk * sc) / (sk * uc) * 100
    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (fek < 6) {
      interpretation = 'FEK < 6% — 腎外性のK喪失を示唆（消化管喪失・細胞内移行など）'
      severity = 'wn'
    } else if (fek <= 15) {
      interpretation = 'FEK 6〜15% — 正常範囲'
    } else {
      interpretation = 'FEK > 15% — 腎性K喪失を示唆（利尿薬・尿細管障害・アルドステロン過剰など）'
      severity = 'dn'
    }
    return { fek: fek.toFixed(2), severity, interpretation }
  }, [uK, sK, uCr, sCr])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity={result.severity} value={`FEK = ${result.fek}%`} interpretation={result.interpretation} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">計算式:</strong> FEK = (尿K × 血清Cr) / (血清K × 尿Cr) × 100</p><p><strong className="text-tx">低K血症の鑑別:</strong> FEK &gt; 6-10%: 腎性喪失（利尿薬・RTA・Bartter等）</p><p><strong className="text-tx">高K血症の鑑別:</strong> FEK &lt; 10%: 腎からの排泄低下（低アルドステロン・腎不全）</p></div>}
      relatedTools={[{ href: '/tools/calc/fena', name: 'FENa' }, { href: '/tools/calc/feua', name: 'FEUA' }, { href: '/tools/calc/feun', name: 'FEUN' }, { href: '/tools/calc/femg', name: 'FEMg' }]}
      references={toolDef.sources || []}
    >
      <NumberInput label="尿中K (mEq/L)" value={uK} onChange={setUK} />
      <NumberInput label="血清K (mEq/L)" value={sK} onChange={setSK} step="0.1" />
      <NumberInput label="尿中Cr (mg/dL)" value={uCr} onChange={setUCr} />
      <NumberInput label="血清Cr (mg/dL)" value={sCr} onChange={setSCr} step="0.1" />
    </CalculatorLayout>
  )
}
