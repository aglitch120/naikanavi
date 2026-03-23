'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('legionella-score')!
const items = [
  { name: '体温 ≧ 39.4℃', score: 2 },
  { name: '咳嗽なし（初期）', score: -1 },
  { name: '下痢あり', score: 3 },
  { name: 'LDH > 225 U/L', score: 1 },
  { name: 'CRP > 18.7 mg/dL', score: 2 },
  { name: 'Na < 134 mEq/L', score: 2 },
  { name: '血小板 < 17.1 万/μL', score: -2 },
]
export default function LegionellaScorePage() {
  const [checked, setChecked] = useState<boolean[]>(items.map(() => false))
  const result = useMemo(() => {
    const total = items.reduce((sum, item, i) => sum + (checked[i] ? item.score : 0), 0)
    let severity: 'ok' | 'wn' | 'dn' = 'ok', interpretation = ''
    if (total >= 5) { interpretation = `${total}点 — レジオネラ肺炎の可能性が高い。尿中抗原検査を提出`; severity = 'dn' }
    else if (total >= 2) { interpretation = `${total}点 — 中間リスク。臨床状況に応じて尿中抗原検査考慮`; severity = 'wn' }
    else { interpretation = `${total}点 — レジオネラ肺炎の可能性は低い` }
    return { total, severity, interpretation }
  }, [checked])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={`スコア = ${result.total}点`} interpretation={result.interpretation} />}
      explanation={<div className="text-sm text-muted"><p>市中肺炎の中からレジオネラ肺炎を予測するスコア。温泉歴・循環水曝露がある場合は臨床的に疑う。</p></div>}
      relatedTools={[{ slug: 'curb-65', name: 'CURB-65' }, { slug: 'a-drop', name: 'A-DROP' }, { slug: 'psi-port', name: 'PSI/PORT' }]}
      references={toolDef.sources || []}
    >
      <div className="space-y-2">
        {items.map((item, i) => (
          <label key={i} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${checked[i] ? 'bg-acl border border-ac/30' : 'bg-s0 border border-br hover:border-ac/20'}`}>
            <input type="checkbox" checked={checked[i]} onChange={() => { const nc = [...checked]; nc[i] = !nc[i]; setChecked(nc) }}
              className="accent-[var(--ac)]" />
            <span className="text-sm text-tx flex-1">{item.name}</span>
            <span className="text-xs text-muted">{item.score > 0 ? '+' : ''}{item.score}点</span>
          </label>
        ))}
      </div>
    </CalculatorLayout>
  )
}
