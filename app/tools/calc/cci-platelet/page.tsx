'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('cci-platelet')!
export default function CciPlateletPage() {
  const [pltPost, setPltPost] = useState('5.0')
  const [pltPre, setPltPre] = useState('1.0')
  const [bsaVal, setBsaVal] = useState('1.7')
  const [pltDose, setPltDose] = useState('2.0')
  const result = useMemo(() => {
    const post = parseFloat(pltPost), pre = parseFloat(pltPre), bsa = parseFloat(bsaVal), dose = parseFloat(pltDose)
    if (isNaN(post) || isNaN(pre) || !bsa || !dose) return null
    const cci = ((post - pre) * 10000 * bsa) / (dose * 10000)
    const cci1h = cci
    let severity: 'ok' | 'wn' | 'dn' = 'ok', interpretation = ''
    if (cci1h >= 7.5) { interpretation = 'CCI ≧ 7,500 — 輸血効果良好（1時間値の場合）' }
    else if (cci1h >= 5.0) { interpretation = 'CCI 5,000-7,500 — やや低下。抗体スクリーニング検討'; severity = 'wn' }
    else { interpretation = 'CCI < 5,000 — 輸血不応。HLAマッチ血小板やIVIg考慮'; severity = 'dn' }
    return { cci: (cci * 1000).toFixed(0), severity, interpretation }
  }, [pltPost, pltPre, bsaVal, pltDose])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity={result.severity} value={`CCI = ${result.cci}`} interpretation={result.interpretation} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">計算式:</strong> CCI = (輸血後Plt - 輸血前Plt) × BSA / 輸血血小板数(×10¹¹)</p><p><strong className="text-tx">判定(1時間値):</strong> ≧7,500 良好 / &lt;5,000 不応</p><p><strong className="text-tx">判定(24時間値):</strong> ≧4,500 良好 / &lt;2,500 不応</p></div>}
      relatedTools={[{ slug: 'plt-transfusion', name: 'PLT輸血上昇予測' }, { slug: 'bsa', name: 'BSA' }]}
      references={toolDef.sources || []}
    >
      <NumberInput label="輸血後Plt (万/μL)" value={pltPost} onChange={setPltPost} step={0.1} />
      <NumberInput label="輸血前Plt (万/μL)" value={pltPre} onChange={setPltPre} step={0.1} />
      <NumberInput label="BSA (m²)" value={bsaVal} onChange={setBsaVal} step={0.01} />
      <NumberInput label="輸血血小板数 (×10¹¹)" value={pltDose} onChange={setPltDose} step={0.1} />
    </CalculatorLayout>
  )
}
