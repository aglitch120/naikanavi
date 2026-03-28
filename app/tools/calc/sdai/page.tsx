'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('sdai')!
export default function SdaiPage() {
  const [tjc, setTjc] = useState('4')
  const [sjc, setSjc] = useState('3')
  const [ptVas, setPtVas] = useState('40')
  const [mdVas, setMdVas] = useState('30')
  const [crp, setCrp] = useState('2.0')
  const result = useMemo(() => {
    const t = parseFloat(tjc), s = parseFloat(sjc), pv = parseFloat(ptVas), mv = parseFloat(mdVas), c = parseFloat(crp)
    if ([t,s,pv,mv,c].some(v => isNaN(v))) return null
    const sdai = t + s + pv / 10 + mv / 10 + c
    let severity: 'ok' | 'wn' | 'dn' = 'ok', activity = ''
    if (sdai <= 3.3) { activity = '寛解 (≦3.3)' }
    else if (sdai <= 11) { activity = '低疾患活動性 (3.3-11)'; severity = 'wn' }
    else if (sdai <= 26) { activity = '中等度疾患活動性 (11-26)'; severity = 'wn' }
    else { activity = '高疾患活動性 (>26)'; severity = 'dn' }
    return { sdai: sdai.toFixed(1), activity, severity }
  }, [tjc, sjc, ptVas, mdVas, crp])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity={result.severity} value={`SDAI = ${result.sdai}`} interpretation={result.activity} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">計算式:</strong> SDAI = TJC28 + SJC28 + PtVAS(cm) + MdVAS(cm) + CRP(mg/dL)</p><p>VASは0-100mmを0-10cmで入力。DAS28より計算が簡易。</p></div>}
      relatedTools={[{ slug: 'das28', name: 'DAS28' }, { slug: 'ra-criteria', name: 'RA分類基準' }]}
      references={toolDef.sources || []}
    >
      <NumberInput label="圧痛関節数 TJC28" value={tjc} onChange={setTjc} />
      <NumberInput label="腫脹関節数 SJC28" value={sjc} onChange={setSjc} />
      <NumberInput label="患者VAS (mm, 0-100)" value={ptVas} onChange={setPtVas} hint="0-100mmで入力（0-10cmスケールの場合は×10）" />
      <NumberInput label="医師VAS (mm, 0-100)" value={mdVas} onChange={setMdVas} hint="0-100mmで入力（0-10cmスケールの場合は×10）" />
      <NumberInput label="CRP (mg/dL)" value={crp} onChange={setCrp} step={0.1} />
    </CalculatorLayout>
  )
}
