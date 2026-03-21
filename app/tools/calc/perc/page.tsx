'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('perc')!

const criteria = [
  { id: 'age', label: '年齢 ≥ 50歳' },
  { id: 'hr', label: '心拍数 ≥ 100/min' },
  { id: 'spo2', label: 'SpO₂ < 95%（室内気）' },
  { id: 'hemoptysis', label: '喀血あり' },
  { id: 'estrogen', label: 'エストロゲン使用中' },
  { id: 'surgery', label: '4週以内の手術・外傷' },
  { id: 'dvt_hx', label: 'DVT/PE既往' },
  { id: 'leg', label: '片側下肢腫脹' },
]

export default function PercPage() {
  const [checks, setChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(criteria.map(c => [c.id, false]))
  )
  const result = useMemo(() => {
    const anyPositive = criteria.some(c => checks[c.id])
    const severity: 'ok'|'dn' = anyPositive ? 'dn' : 'ok'
    const label = anyPositive
      ? 'PERC陽性 — PEを除外できない（D-dimer or CTを検討）'
      : 'PERC陰性（全8項目なし）— PE除外可能（D-dimer不要）'
    return { anyPositive, severity, label, count: criteria.filter(c => checks[c.id]).length }
  }, [checks])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="PERC Rule" value={result.anyPositive ? '除外不可' : 'PE除外'} unit="" interpretation={result.label} severity={result.severity}
        details={[{ label: '該当項目数', value: `${result.count} / 8` }]} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">PERC Ruleとは</h2>
          <p>PE（肺塞栓症）の検査前確率が低い（&lt;15%）患者に対し、8項目すべて陰性であればD-dimer検査なしでPEを除外できるルールです。不要なD-dimer検査とCT検査を削減します。</p>
          <h3 className="font-bold text-tx">適用条件</h3>
          <p>Wellsスコア ≤ 4（PE unlikely）の患者にのみ適用。1項目でも該当すればPERC陰性とならず、通常の検査フローに進みます。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Kline JA, et al. J Thromb Haemost 2004;2:1247-1255' }]}
    >
      <div className="space-y-2">
        <p className="text-xs text-muted mb-2">※ 1つでも該当するとPERC陰性にならない</p>
        {criteria.map(c => <CheckItem key={c.id} id={c.id} label={c.label} points={1} checked={checks[c.id]} onChange={v => setChecks(p => ({...p,[c.id]:v}))} />)}
      </div>
    </CalculatorLayout>
  )
}
