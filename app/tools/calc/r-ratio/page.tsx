'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('r-ratio')!
export default function RRatioPage() {
  const [alt, setAlt] = useState('200')
  const [altUln, setAltUln] = useState('40')
  const [alp, setAlp] = useState('300')
  const [alpUln, setAlpUln] = useState('340')
  const result = useMemo(() => {
    const a = parseFloat(alt), au = parseFloat(altUln), p = parseFloat(alp), pu = parseFloat(alpUln)
    if (!a || !au || !p || !pu) return null
    const altRatio = a / au
    const alpRatio = p / pu
    if (alpRatio === 0) return null
    const r = altRatio / alpRatio
    let type = '', severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (r >= 5) { type = '肝細胞障害型'; severity = 'dn' }
    else if (r <= 2) { type = '胆汁うっ滞型'; severity = 'wn' }
    else { type = '混合型'; severity = 'wn' }
    return { r: r.toFixed(2), altRatio: altRatio.toFixed(1), alpRatio: alpRatio.toFixed(1), type, severity }
  }, [alt, altUln, alp, alpUln])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity={result.severity} value={`R = ${result.r} → ${result.type}`}
        interpretation={`ALT/ULN = ${result.altRatio}、ALP/ULN = ${result.alpRatio}\n• R ≧ 5: 肝細胞障害型\n• R ≦ 2: 胆汁うっ滞型\n• 2 < R < 5: 混合型`} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">計算式:</strong> R = (ALT / ALT基準上限) / (ALP / ALP基準上限)</p><p>薬剤性肝障害(DILI)の初期分類に使用。DDW-J 2004やRECAM-Jでも最初のステップとして利用。</p></div>}
      relatedTools={[{ slug: 'ddw-j-dili', name: 'DDW-J 2004' }, { slug: 'recam-j', name: 'RECAM-J' }, { slug: 'child-pugh', name: 'Child-Pugh' }]}
      references={toolDef.sources || []}
    >
      <NumberInput label="ALT (U/L)" value={alt} onChange={setAlt} />
      <NumberInput label="ALT基準上限 (U/L)" value={altUln} onChange={setAltUln} />
      <NumberInput label="ALP (U/L)" value={alp} onChange={setAlp} />
      <NumberInput label="ALP基準上限 (U/L)" value={alpUln} onChange={setAlpUln} hint="JSCC法(慣用値)340 U/L。IFCC法の場合は約115 U/Lに変更してください" />
    </CalculatorLayout>
  )
}
