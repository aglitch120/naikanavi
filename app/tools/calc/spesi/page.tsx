'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('spesi')!

const criteria = [
  { id: 'age', label: '年齢 > 80歳', points: 1 },
  { id: 'cancer', label: '活動性のがん', points: 1 },
  { id: 'chf_copd', label: '心不全 or 慢性肺疾患', points: 1 },
  { id: 'hr', label: '心拍数 ≥ 110/min', points: 1 },
  { id: 'sbp', label: '収縮期血圧 < 100 mmHg', points: 1 },
  { id: 'spo2', label: 'SpO₂ < 90%', points: 1 },
]

export default function SpesiPage() {
  const [checks, setChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(criteria.map(c => [c.id, false]))
  )
  const result = useMemo(() => {
    const score = criteria.filter(c => checks[c.id]).length
    const lowRisk = score === 0
    const severity: 'ok'|'dn' = lowRisk ? 'ok' : 'dn'
    const label = lowRisk ? '低リスク（0点）— 30日死亡率 1.0%、外来治療を検討可能' : '高リスク（≥1点）— 30日死亡率 10.9%、入院治療が標準'
    return { score, severity, label, lowRisk }
  }, [checks])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="sPESI" value={result.score} unit="/ 6点" interpretation={result.label} severity={result.severity}
        details={[{ label: '30日死亡率', value: result.lowRisk ? '1.0%' : '10.9%' }]} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">sPESI（簡易PESI）とは</h2>
          <p>肺塞栓症（PE）確定後の短期予後（30日死亡率）を予測する簡易スコアです。0点なら低リスクとして外来治療を検討できます。ESCガイドラインでも示されています。</p>
          <h3 className="font-bold text-tx">判定</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>0点: 低リスク（30日死亡率 1.0%）→ 外来治療を検討</li>
            <li>≥1点: 高リスク（30日死亡率 10.9%）→ 入院管理</li>
          </ul>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Jiménez D, et al. Arch Intern Med 2010;170:1383-1389' }]}
    >
      <div className="space-y-2">
        {criteria.map(c => <CheckItem key={c.id} id={c.id} label={c.label} points={c.points} checked={checks[c.id]} onChange={v => setChecks(p => ({...p,[c.id]:v}))} />)}
      </div>
    </CalculatorLayout>
  )
}
