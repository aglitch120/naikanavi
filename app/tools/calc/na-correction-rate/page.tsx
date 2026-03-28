'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('na-correction-rate')!

export default function NaCorrectionRatePage() {
  const [naInitial, setNaInitial] = useState('120')
  const [naCurrent, setNaCurrent] = useState('124')
  const [hours, setHours] = useState('6')
  const [risk, setRisk] = useState('normal')

  const result = useMemo(() => {
    const init = parseFloat(naInitial) || 0
    const curr = parseFloat(naCurrent) || 0
    const h = parseFloat(hours) || 1
    const change = curr - init
    const rate = change / h
    const rate24 = rate * 24

    // Safe limits
    const isHighRisk = risk === 'high'
    const limit24 = isHighRisk ? 8 : 10  // mEq/L per 24h
    const limit48 = isHighRisk ? 14 : 18 // mEq/L per 48h

    const projected24 = rate * 24
    const isSafe24 = Math.abs(projected24) <= limit24

    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    let label = ''

    if (change === 0) {
      label = 'Na変動なし'
      severity = 'neutral' as any
    } else if (Math.abs(projected24) <= limit24 * 0.7) {
      label = '安全範囲内'
      severity = 'ok'
    } else if (Math.abs(projected24) <= limit24) {
      label = '上限に近い — 注意して経過観察'
      severity = 'wn'
    } else {
      label = `⚠ 24時間安全上限（最大値: ${limit24} mEq/L）超過リスク — 補正速度を下げてください`
      severity = 'dn'
    }

    return {
      change: change.toFixed(1),
      rate: rate.toFixed(2),
      projected24: projected24.toFixed(1),
      limit24,
      limit48,
      severity,
      label,
      isSafe24,
    }
  }, [naInitial, naCurrent, hours, risk])

  return (
    <CalculatorLayout
      slug={toolDef.slug}
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={
        <ResultCard
          label="Na補正速度"
          value={result.rate}
          unit="mEq/L/時"
          interpretation={result.label}
          severity={result.severity}
          details={[
            { label: 'Na変化量', value: `${result.change} mEq/L（${hours}時間）` },
            { label: '24時間換算変化量', value: `${result.projected24} mEq/L` },
            { label: '推奨補正目標（24h）', value: '通常 6〜8 mEq/L' },
            { label: '安全上限・最大値（24h）', value: `${result.limit24} mEq/L（超えてはならない最大値）` },
            { label: '安全上限・最大値（48h）', value: `${result.limit48} mEq/L` },
          ]}
        />
      }
      explanation={<div className="text-sm text-muted space-y-1">
        <p>推奨補正目標: 通常 6〜8 mEq/L/24h。上限10 mEq/Lは超えてはならない最大値であり、治療目標ではありません。高リスク例（慢性低Na・低K・アルコール・肝疾患・低栄養）では上限8 mEq/L/24h。</p>
      </div>}
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Sterns RH. Am J Med 2006;119:S12-S16' },
        { text: 'Verbalis JG, et al. Am J Med 2013;126:S1-S42' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="na-initial" label="初回Na（補正開始時）" unit="mEq/L" value={naInitial} onChange={setNaInitial} step={1} />
        <NumberInput id="na-current" label="現在のNa" unit="mEq/L" value={naCurrent} onChange={setNaCurrent} step={1} />
        <NumberInput id="hours" label="経過時間" unit="時間" value={hours} onChange={setHours} step={0.5} min={0.5} />
        <RadioGroup
          label="ODSリスク"
          name="ods-risk"
          value={risk}
          onChange={setRisk}
          options={[
            { value: 'normal', label: '通常' },
            { value: 'high', label: '高リスク' },
          ]}
        />
        <p className="text-xs text-muted">高リスク: 慢性低Na・低K合併・アルコール・肝疾患・低栄養</p>
        <p className="text-xs text-muted mt-1">※急性症候性低Na血症（発症&lt;48h）では最初1-2時間で4-6 mEq/L上昇が目標</p>
      </div>
    </CalculatorLayout>
  )
}
