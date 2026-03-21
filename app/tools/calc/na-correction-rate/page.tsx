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
      label = `⚠ 24時間上限（${limit24} mEq/L）超過リスク — 補正速度を下げてください`
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
            { label: '24時間安全上限', value: `${result.limit24} mEq/L` },
            { label: '48時間安全上限', value: `${result.limit48} mEq/L` },
          ]}
        />
      }
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">Na補正速度の安全管理</h2>
          <p>低ナトリウム血症の補正が速すぎると浸透圧性脱髄症候群（ODS）を引き起こすリスクがあります。安全な補正速度を守ることが極めて重要です。</p>
          <h3 className="font-bold text-tx">参考補正速度上限</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>通常リスク: 24時間で10 mEq/L以内、48時間で18 mEq/L以内</li>
            <li>高リスク（慢性低Na、低K血症合併、アルコール、肝疾患、低栄養）: 24時間で8 mEq/L以内、48時間で14 mEq/L以内</li>
          </ul>
          <h3 className="font-bold text-tx">ODS高リスク群</h3>
          <p>Na ≤ 105 mEq/L、慢性低Na血症（48時間以上経過）、低K血症合併、アルコール使用障害、肝疾患、低栄養の患者では特に慎重な補正が必要です。</p>
        </section>
      }
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
      </div>
    </CalculatorLayout>
  )
}
