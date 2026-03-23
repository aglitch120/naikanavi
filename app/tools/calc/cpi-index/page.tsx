'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('cpi-index')!
export default function CpiIndexPage() {
  const [cpr, setCpr] = useState('2.0')
  const [glu, setGlu] = useState('120')
  const result = useMemo(() => {
    const c = parseFloat(cpr), g = parseFloat(glu)
    if (!c || !g) return null
    const cpi = c / g * 100
    let interpretation = '', severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (cpi >= 1.2) { interpretation = 'CPI ≧ 1.2 — インスリン分泌能保持。経口薬が有効な可能性が高い' }
    else if (cpi >= 0.8) { interpretation = 'CPI 0.8〜1.2 — インスリン分泌能やや低下。経口薬で管理可能だが注意'; severity = 'wn' }
    else { interpretation = 'CPI < 0.8 — インスリン依存状態。インスリン療法を考慮'; severity = 'dn' }
    return { cpi: cpi.toFixed(2), severity, interpretation }
  }, [cpr, glu])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity={result.severity} value={`CPI = ${result.cpi}`} interpretation={result.interpretation} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">計算式:</strong> CPI = 空腹時CPR (ng/mL) ÷ 空腹時血糖 (mg/dL) × 100</p><p>HOMA-βと比較して、インスリン療法中でも評価可能（外因性インスリンはCPRに影響しないため）。</p></div>}
      relatedTools={[{ slug: 'homa', name: 'HOMA-IR/β' }, { slug: 'hba1c-glucose', name: 'HbA1c↔血糖' }, { slug: 'ga-hba1c', name: 'GA↔HbA1c' }]}
      references={toolDef.sources || []}
    >
      <NumberInput label="空腹時CPR (ng/mL)" value={cpr} onChange={setCpr} step="0.1" />
      <NumberInput label="空腹時血糖 (mg/dL)" value={glu} onChange={setGlu} />
    </CalculatorLayout>
  )
}
