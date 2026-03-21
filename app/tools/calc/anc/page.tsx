'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('anc')!

export default function AncPage() {
  const [wbc, setWbc] = useState('3000')
  const [neutro, setNeutro] = useState('40')
  const [bands, setBands] = useState('5')

  const result = useMemo(() => {
    const w = parseFloat(wbc)
    const n = parseFloat(neutro)
    if (!w || isNaN(n)) return null

    const b = parseFloat(bands) || 0
    const anc = w * (n + b) / 100

    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (anc < 100) {
      interpretation = '重度好中球減少（< 100） — 重症感染リスク極めて高い'
      severity = 'dn'
    } else if (anc < 500) {
      interpretation = '高度好中球減少（< 500） — FN基準。感染対策強化'
      severity = 'dn'
    } else if (anc < 1000) {
      interpretation = '中等度好中球減少（500〜1000）'
      severity = 'wn'
    } else if (anc < 1500) {
      interpretation = '軽度好中球減少（1000〜1500）'
      severity = 'wn'
    } else {
      interpretation = '好中球数正常（≧ 1500）'
    }

    return { anc: Math.round(anc), severity, interpretation }
  }, [wbc, neutro, bands])

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
          label="ANC"
          value={result.anc}
          unit="/μL"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: 'FN基準', value: 'ANC < 500（または48h以内に< 500が予想）+ 体温 ≧ 38.3℃' },
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">好中球数（ANC）とは</h2>
          <p>ANCは白血球数に好中球の割合（分葉核球＋桿状核球）を乗じて算出。化学療法後の感染リスク評価に必須です。</p>
          <p className="font-mono bg-bg p-2 rounded text-xs">ANC = WBC × (好中球% + 桿状核球%) / 100</p>
          <h3 className="font-bold text-tx">FN（発熱性好中球減少症）</h3>
          <p>ANC &lt; 500/μL ＋ 体温 ≧ 38.3℃（または38.0℃が1時間以上持続）で定義。MASCC スコアで低リスク/高リスクを層別化します。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'NCCN Guidelines: Prevention and Treatment of Cancer-Related Infections' },
        { text: 'Freifeld AG, et al. Clin Infect Dis 2011;52:e56-e93' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="wbc" label="白血球数（WBC）" unit="/μL" value={wbc} onChange={setWbc} min={100} max={100000} step={100} />
        <NumberInput id="neutro" label="好中球（分葉核球）" unit="%" value={neutro} onChange={setNeutro} min={0} max={100} step={0.1} />
        <NumberInput id="bands" label="桿状核球（任意）" unit="%" hint="自動分類では省略されることがあります" value={bands} onChange={setBands} min={0} max={50} step={0.1} />
      </div>
    </CalculatorLayout>
  )
}
