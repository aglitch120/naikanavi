'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('homa')!

export default function HomaPage() {
  const [fbs, setFbs] = useState('110')
  const [iri, setIri] = useState('12')

  const result = useMemo(() => {
    const f = parseFloat(fbs); const i = parseFloat(iri)
    if (!f || !i) return null
    const ir = f * i / 405
    const beta = 360 * i / (f - 63)
    const betaValid = f > 63

    let irInterpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (ir >= 2.5) { irInterpretation = 'インスリン抵抗性あり（≧2.5）'; severity = 'dn' }
    else if (ir >= 1.6) { irInterpretation = '境界域（1.6〜2.5）'; severity = 'wn' }
    else { irInterpretation = 'インスリン抵抗性なし（< 1.6）' }

    return { ir: ir.toFixed(2), beta: betaValid ? beta.toFixed(0) : null, irInterpretation, severity }
  }, [fbs, iri])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard label="HOMA-IR" value={result.ir} interpretation={result.irInterpretation} severity={result.severity}
          details={[
            ...(result.beta ? [{ label: 'HOMA-β', value: `${result.beta}%（正常: 40-60%）` }] : []),
            { label: 'インスリン抵抗性基準', value: '≧ 2.5 で抵抗性あり' },
          ]} />
      )}
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Matthews DR, et al. Diabetologia 1985;28:412-419' }]}
    >
      <div className="space-y-4">
        <NumberInput id="fbs" label="空腹時血糖（FBS）" unit="mg/dL" value={fbs} onChange={setFbs} min={30} max={500} step={1} />
        <NumberInput id="iri" label="空腹時インスリン（IRI）" unit="μU/mL" value={iri} onChange={setIri} min={0.1} max={200} step={0.1} />
      </div>
    </CalculatorLayout>
  )
}
