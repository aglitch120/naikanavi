'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('tsat')!

export default function TSATPage() {
  const [serumIron, setSerumIron] = useState('60')
  const [tibc, setTibc] = useState('350')

  const result = useMemo(() => {
    const fe = parseFloat(serumIron)
    const tibcVal = parseFloat(tibc)
    if (!fe || !tibcVal || tibcVal === 0) return null

    const tsat = (fe / tibcVal) * 100

    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (tsat < 16) {
      interpretation = 'TSAT著明低値 — 鉄欠乏が強く疑われる（機能的鉄欠乏含む）'
      severity = 'dn'
    } else if (tsat < 20) {
      interpretation = 'TSAT低値 — 鉄欠乏を示唆。CKD患者ではESA治療前の鉄補充適応'
      severity = 'wn'
    } else if (tsat > 50) {
      interpretation = 'TSAT高値 — 鉄過剰を考慮（ヘモクロマトーシス・輸血後・鉄剤過量）'
      severity = 'wn'
    } else if (tsat > 45) {
      interpretation = 'TSAT軽度高値 — 鉄過剰の精査を考慮（フェリチンと合わせて評価）'
      severity = 'wn'
    } else {
      interpretation = '正常範囲（20〜45%）'
    }

    return {
      tsat: tsat.toFixed(1),
      severity,
      interpretation,
    }
  }, [serumIron, tibc])

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
          label="TSAT"
          value={result.tsat}
          unit="%"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: '正常範囲', value: '20〜45%' },
            { label: '鉄欠乏の閾値', value: '<20%（CKD: <20%で鉄補充適応）' },
            { label: '鉄過剰の閾値', value: '>45%' },
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">TSAT（トランスフェリン飽和度）とは</h2>
          <p>血清中のトランスフェリンのうち鉄が結合している割合。鉄欠乏と鉄過剰の評価に用いる基本的な鉄代謝マーカーです。</p>
          <p className="font-mono bg-bg p-2 rounded text-xs">TSAT (%) = 血清鉄 ÷ TIBC × 100</p>
          <h3 className="font-bold text-tx">臨床的意義</h3>
          <p>TSAT &lt; 20%: 鉄欠乏（絶対的 or 機能的）。フェリチンと組み合わせて評価します。CKD患者ではTSAT &lt; 20% かつ フェリチン &lt; 100 ng/mL で鉄補充の適応。</p>
          <p>TSAT &gt; 45%: 鉄過剰を示唆。遺伝性ヘモクロマトーシスのスクリーニング閾値として用いられます。</p>
          <h3 className="font-bold text-tx">注意点</h3>
          <p>血清鉄は日内変動（朝高値・夕低値）があり、食事・炎症の影響も受けます。単回測定のTSATだけで判断せず、フェリチン・CRP・網赤血球と合わせて総合評価してください。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'KDIGO 2012 Clinical Practice Guideline for Anemia in CKD. Kidney Int Suppl 2012;2:279-335' },
        { text: 'Camaschella C. Iron-deficiency anemia. N Engl J Med 2015;372:1832-1843' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="serumIron" label="血清鉄 (Fe)" unit="μg/dL" value={serumIron} onChange={setSerumIron} min={1} max={500} step={1} />
        <NumberInput id="tibc" label="TIBC（総鉄結合能）" unit="μg/dL" value={tibc} onChange={setTibc} min={50} max={700} step={1} />
      </div>
    </CalculatorLayout>
  )
}
