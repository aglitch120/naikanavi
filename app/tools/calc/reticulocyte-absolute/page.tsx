'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('reticulocyte-absolute')!
export default function ReticulocyteAbsPage() {
  const [retPct, setRetPct] = useState('3.0')
  const [rbc, setRbc] = useState('350')
  const result = useMemo(() => {
    const r = parseFloat(retPct), rb = parseFloat(rbc)
    if (!r || !rb) return null
    const absRet = r * rb * 100
    let severity: 'ok' | 'wn' | 'dn' = 'ok', interpretation = ''
    if (absRet >= 100000) { interpretation = `絶対値Ret = ${(absRet/10000).toFixed(1)}万/μL — 骨髄反応あり（溶血・出血後の回復期）` }
    else if (absRet >= 50000) { interpretation = `絶対値Ret = ${(absRet/10000).toFixed(1)}万/μL — 正常範囲`; }
    else { interpretation = `絶対値Ret = ${(absRet/10000).toFixed(1)}万/μL — 骨髄反応低下（産生低下型貧血）`; severity = 'wn' }
    return { absRet: (absRet).toFixed(0), severity, interpretation }
  }, [retPct, rbc])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity={result.severity} value={`絶対値Ret = ${result.absRet} /μL`} interpretation={result.interpretation} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">計算式:</strong> 絶対値Ret = 網赤血球比率(%) × RBC(万/μL) × 100</p><p>正常: 約5-10万/μL。貧血時は比率(%)ではなく絶対値で評価すべき。RPIも併用。</p></div>}
      relatedTools={[{ slug: 'rpi', name: 'RPI' }, { slug: 'anemia-criteria', name: '貧血の診断基準' }]}
      references={toolDef.sources || []}
    >
      <NumberInput label="網赤血球比率 (%)" value={retPct} onChange={setRetPct} step="0.1" />
      <NumberInput label="RBC (万/μL)" value={rbc} onChange={setRbc} />
    </CalculatorLayout>
  )
}
