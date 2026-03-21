'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('timi')!

const criteria = [
  { id: 'age', label: '年齢 ≥ 65歳', points: 1 },
  { id: 'risk3', label: 'CADリスク因子 ≥ 3個', sublabel: '高血圧・DM・脂質異常・喫煙・家族歴', points: 1 },
  { id: 'cad', label: '既知のCAD（狭窄 ≥ 50%）', points: 1 },
  { id: 'asa', label: '過去7日以内のアスピリン使用', points: 1 },
  { id: 'angina', label: '24時間以内に2回以上の狭心症', points: 1 },
  { id: 'st', label: 'ST変化 ≥ 0.5mm', points: 1 },
  { id: 'marker', label: '心筋マーカー上昇', points: 1 },
]

export default function TimiPage() {
  const [checks, setChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(criteria.map(c => [c.id, false]))
  )
  const result = useMemo(() => {
    const score = criteria.filter(c => checks[c.id]).length
    const risk = ['4.7%', '4.7%', '8.3%', '13.2%', '19.9%', '26.2%', '40.9%', '40.9%'][score]
    const severity: 'ok' | 'wn' | 'dn' = score <= 2 ? 'ok' : score <= 4 ? 'wn' : 'dn'
    const label = score <= 2 ? '低リスク' : score <= 4 ? '中リスク — 早期侵襲的戦略を検討' : '高リスク — 緊急侵襲的戦略を強く検討'
    return { score, risk, severity, label }
  }, [checks])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="TIMI Risk Score" value={result.score} unit="/ 7点" interpretation={result.label} severity={result.severity}
        details={[{ label: '14日以内イベント率', value: result.risk }]} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">TIMI Risk Scoreとは</h2>
          <p>非ST上昇型ACS（不安定狭心症・NSTEMI）患者の14日以内の死亡・心筋梗塞・緊急血行再建のリスクを予測する7項目のスコアです。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Antman EM, et al. JAMA 2000;284:835-842' }]}
    >
      <div className="space-y-3">
        {criteria.map(c => (
          <CheckItem key={c.id} id={c.id} label={c.label} sublabel={c.sublabel} points={c.points}
            checked={checks[c.id]} onChange={v => setChecks(prev => ({ ...prev, [c.id]: v }))} />
        ))}
      </div>
    </CalculatorLayout>
  )
}
