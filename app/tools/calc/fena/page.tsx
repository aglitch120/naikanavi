'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('fena')!

export default function FenaPage() {
  const [uNa, setUNa] = useState('40')
  const [sNa, setSNa] = useState('140')
  const [uCr, setUCr] = useState('100')
  const [sCr, setSCr] = useState('1.5')

  const result = useMemo(() => {
    const un = parseFloat(uNa)
    const sn = parseFloat(sNa)
    const uc = parseFloat(uCr)
    const sc = parseFloat(sCr)
    if (!un || !sn || !uc || !sc) return null

    const fena = (un * sc) / (sn * uc) * 100
    const feUrea = null // future extension

    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (fena < 1) {
      interpretation = 'FENa < 1% — 腎前性AKI（有効循環血漿量低下）を示唆'
      severity = 'wn'
    } else if (fena <= 2) {
      interpretation = 'FENa 1〜2% — 境界域。臨床所見と合わせて判断'
      severity = 'wn'
    } else {
      interpretation = 'FENa > 2% — 腎性AKI（ATN等）を示唆'
      severity = 'dn'
    }

    return { fena: fena.toFixed(2), severity, interpretation }
  }, [uNa, sNa, uCr, sCr])

  return (
    <CalculatorLayout
      slug={toolDef.slug}
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard
          label="FENa"
          value={result.fena}
          unit="%"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: '腎前性の目安', value: '< 1%' },
            { label: '腎性（ATN）の目安', value: '> 2%' },
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">FENa（ナトリウム排泄率）とは</h2>
          <p>糸球体で濾過されたNaのうち、尿中に排泄される割合。AKIの腎前性 vs 腎性の鑑別に使用されます。</p>
          <p className="font-mono bg-bg p-2 rounded text-xs">FENa (%) = (尿Na × 血清Cr) / (血清Na × 尿Cr) × 100</p>
          <h3 className="font-bold text-tx">注意点</h3>
          <p>利尿薬使用中はFENaが偽高値となるため、FEUrea（尿素排泄率）を代用します（FEUrea &lt; 35%で腎前性）。造影剤腎症・横紋筋融解・急性糸球体腎炎ではFENa &lt; 1%でも腎性AKIの可能性があります。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Espinel CH. JAMA 1976;236:579-581' },
        { text: 'Steiner RW. Am J Med 1984;77:699-702' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="uNa" label="尿中Na" unit="mEq/L" value={uNa} onChange={setUNa} min={1} max={300} step={1} />
        <NumberInput id="sNa" label="血清Na" unit="mEq/L" value={sNa} onChange={setSNa} min={100} max={180} step={0.1} />
        <NumberInput id="uCr" label="尿中Cr" unit="mg/dL" value={uCr} onChange={setUCr} min={1} max={500} step={1} />
        <NumberInput id="sCr" label="血清Cr" unit="mg/dL" value={sCr} onChange={setSCr} min={0.1} max={30} step={0.01} />
      </div>
    </CalculatorLayout>
  )
}
