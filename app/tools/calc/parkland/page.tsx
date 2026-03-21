'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('parkland')!

export default function ParklandPage() {
  const [weight, setWeight] = useState('70')
  const [tbsa, setTbsa] = useState('25')

  const result = useMemo(() => {
    const w = parseFloat(weight)
    const t = parseFloat(tbsa)
    if (!w || !t) return null

    const total24h = 4 * t * w
    const first8h = total24h / 2
    const next16h = total24h / 2
    const rateFirst8 = first8h / 8
    const rateNext16 = next16h / 16
    const urineTarget = w * 0.5

    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (t >= 50) severity = 'dn'
    else if (t >= 20) severity = 'wn'

    let interpretation = ''
    if (t >= 50) interpretation = '広範囲熱傷 — ICU管理・気道確保を最優先'
    else if (t >= 20) interpretation = '中等度〜重度熱傷 — 十分な輸液管理が必要'
    else interpretation = '軽度〜中等度熱傷'

    return {
      total24h: Math.round(total24h),
      first8h: Math.round(first8h),
      next16h: Math.round(next16h),
      rateFirst8: Math.round(rateFirst8),
      rateNext16: Math.round(rateNext16),
      urineTarget: urineTarget.toFixed(0),
      severity,
      interpretation,
    }
  }, [weight, tbsa])

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
          label="24時間総輸液量"
          value={result.total24h}
          unit="mL"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: '最初8時間', value: `${result.first8h} mL（${result.rateFirst8} mL/h）` },
            { label: '次の16時間', value: `${result.next16h} mL（${result.rateNext16} mL/h）` },
            { label: '尿量目標', value: `≧ ${result.urineTarget} mL/h（0.5 mL/kg/h）` },
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">Parkland（Baxter）式とは</h2>
          <p>熱傷患者の初期輸液量を計算する標準式。乳酸リンゲル液を使用します。</p>
          <p className="font-mono bg-bg p-2 rounded text-xs">輸液量 = 4 mL × TBSA(%) × 体重(kg)</p>
          <p className="text-xs mt-1">受傷後8時間で半量、残り16時間で半量を投与。</p>
          <h3 className="font-bold text-tx">投与量の調整</h3>
          <p>バイタルサイン安定＋尿量 0.5〜1.0 mL/kg/h を目標に投与速度を調整。計算値はあくまで出発点であり、実際の臨床所見に基づいて増減します。</p>
          <h3 className="font-bold text-tx">9の法則（成人TBSA概算）</h3>
          <p>頭頸部9%、上肢各9%、体幹前面18%、体幹後面18%、下肢各18%、会陰1%</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Baxter CR, Shires T. Surg Clin North Am 1968;48:1279-1291' },
        { text: 'American Burn Association Practice Guidelines 2008' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="weight" label="体重" unit="kg" value={weight} onChange={setWeight} min={1} max={300} step={1} />
        <NumberInput id="tbsa" label="熱傷面積（TBSA）" unit="%" hint="9の法則で概算。II度以上の面積のみ" value={tbsa} onChange={setTbsa} min={1} max={100} step={1} />
      </div>
    </CalculatorLayout>
  )
}
