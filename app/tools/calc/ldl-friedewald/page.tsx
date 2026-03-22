'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('ldl-friedewald')!

// 動脈硬化性疾患予防ガイドライン2022準拠
function getLdlTarget(risk: string): { target: number; label: string } {
  switch (risk) {
    case 'low': return { target: 160, label: '低リスク（< 160 mg/dL）' }
    case 'mid': return { target: 140, label: '中リスク（< 140 mg/dL）' }
    case 'high': return { target: 120, label: '高リスク（< 120 mg/dL）' }
    case 'secondary': return { target: 100, label: '二次予防（< 100 mg/dL）' }
    case 'familial': return { target: 100, label: 'FH/ACS（< 70 mg/dL 考慮）' }
    default: return { target: 140, label: '中リスク（< 140 mg/dL）' }
  }
}

export default function LdlFriedewaldPage() {
  const [tc, setTc] = useState('220')
  const [hdl, setHdl] = useState('50')
  const [tg, setTg] = useState('150')

  const result = useMemo(() => {
    const tcVal = parseFloat(tc)
    const hdlVal = parseFloat(hdl)
    const tgVal = parseFloat(tg)
    if (!tcVal || !hdlVal || !tgVal) return null

    const ldl = tcVal - hdlVal - tgVal / 5
    const nonHdl = tcVal - hdlVal
    const tgWarning = tgVal >= 400

    // LDL/HDL ratio
    const lhRatio = ldl / hdlVal

    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (ldl >= 180 || tgWarning) severity = 'dn'
    else if (ldl >= 140) severity = 'wn'

    let interpretation = ''
    if (tgWarning) interpretation = 'TG ≧ 400 mg/dL — Friedewald式は不正確。直接法LDLを測定してください'
    else if (ldl >= 180) interpretation = 'LDL-C著明高値 — 家族性高コレステロール血症（FH）を鑑別'
    else if (ldl >= 140) interpretation = 'LDL-C高値 — 動脈硬化リスク因子を評価し管理目標を設定'
    else if (ldl >= 120) interpretation = 'LDL-C境界域高値 — リスクに応じて管理'
    else interpretation = 'LDL-C正常範囲'

    return {
      ldl: Math.round(ldl),
      nonHdl: Math.round(nonHdl),
      lhRatio: lhRatio.toFixed(2),
      tgWarning,
      severity,
      interpretation,
    }
  }, [tc, hdl, tg])

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
          label="LDL-C"
          value={result.ldl}
          unit="mg/dL"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: 'non-HDL-C', value: `${result.nonHdl} mg/dL（目標: LDL目標+30）` },
            { label: 'LDL/HDL比', value: `${result.lhRatio}（2.0未満が目標）` },
            ...(result.tgWarning ? [{ label: '⚠️ 注意', value: 'TG≧400: 直接法LDLを検討' }] : []),
          ]}
        />
      )}
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Friedewald WT, et al. Clin Chem 1972;18:499-502' },
        { text: '日本動脈硬化学会「動脈硬化性疾患予防ガイドライン2022年版」' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="tc" label="TC（総コレステロール）" unit="mg/dL" value={tc} onChange={setTc} min={50} max={600} step={1} />
        <NumberInput id="hdl" label="HDL-C" unit="mg/dL" value={hdl} onChange={setHdl} min={5} max={200} step={1} />
        <NumberInput id="tg" label="TG（中性脂肪）" unit="mg/dL" hint="空腹時採血を検討。400以上では直接法LDLを使用" value={tg} onChange={setTg} min={10} max={3000} step={1} />
      </div>
    </CalculatorLayout>
  )
}
