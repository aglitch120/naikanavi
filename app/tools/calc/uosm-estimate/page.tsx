'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('uosm-estimate')!
export default function UosmEstimatePage() {
  const [uNa, setUNa] = useState('60')
  const [uK, setUK] = useState('30')
  const [uUN, setUUN] = useState('300')
  const result = useMemo(() => {
    const na = parseFloat(uNa), k = parseFloat(uK), un = parseFloat(uUN)
    if (isNaN(na) || isNaN(k) || isNaN(un)) return null
    const uosm = 2 * (na + k) + un / 2.8
    let severity: 'ok' | 'wn' | 'dn' = 'ok', interpretation = ''
    if (uosm < 100) { interpretation = '推定Uosm < 100 — 希釈尿（水利尿・尿崩症）'; severity = 'wn' }
    else if (uosm < 300) { interpretation = '推定Uosm 100-300 — 等張〜やや低張' }
    else if (uosm <= 800) { interpretation = '推定Uosm 300-800 — 濃縮尿（正常〜脱水）' }
    else { interpretation = '推定Uosm > 800 — 高度濃縮尿'; severity = 'wn' }
    return { uosm: uosm.toFixed(0), severity, interpretation }
  }, [uNa, uK, uUN])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity={result.severity} value={`推定Uosm ≒ ${result.uosm} mOsm/kg`} interpretation={result.interpretation} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">計算式:</strong> 推定Uosm = 2 × (尿Na + 尿K) + 尿UN / 2.8</p><p>実測Uosmが得られない時の代替推算。低Na血症の鑑別で尿浸透圧が必要な場面で使用。</p></div>}
      relatedTools={[{ href: '/tools/calc/urine-osmolality', name: '尿浸透圧(比重)' }, { href: '/tools/calc/plasma-osmolality', name: '血漿浸透圧' }, { href: '/tools/calc/hyponatremia-flow', name: '低Na鑑別' }]}
      references={toolDef.sources || []}
    >
      <NumberInput label="尿中Na (mEq/L)" value={uNa} onChange={setUNa} />
      <NumberInput label="尿中K (mEq/L)" value={uK} onChange={setUK} />
      <NumberInput label="尿中UN (mg/dL)" value={uUN} onChange={setUUN} />
    </CalculatorLayout>
  )
}
