'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('padua')!

const criteria = [
  { id: 'cancer', label: '活動性のがん', points: 3 },
  { id: 'vte_hx', label: 'VTE既往（PE/DVT除外）', points: 3 },
  { id: 'immobile', label: '3日以上の不動（トイレ移動程度）', points: 3 },
  { id: 'thrombophilia', label: '既知の血栓性素因', points: 3 },
  { id: 'trauma_surg', label: '最近（1ヶ月以内）の外傷 or 手術', points: 2 },
  { id: 'age70', label: '年齢 ≥ 70歳', points: 1 },
  { id: 'chf_resp', label: '心不全 or 呼吸不全', points: 1 },
  { id: 'mi_stroke', label: '急性心筋梗塞 or 脳卒中', points: 1 },
  { id: 'infection', label: '急性感染症 or リウマチ疾患', points: 1 },
  { id: 'bmi30', label: 'BMI ≥ 30', points: 1 },
  { id: 'hrt', label: 'ホルモン療法中', points: 1 },
]

export default function PaduaPage() {
  const [checks, setChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(criteria.map(c => [c.id, false]))
  )
  const result = useMemo(() => {
    const score = criteria.filter(c => checks[c.id]).reduce((s, c) => s + c.points, 0)
    const highRisk = score >= 4
    const severity: 'ok'|'wn'|'dn' = highRisk ? 'dn' : 'ok'
    const label = highRisk ? '高リスク（≥4点）— 薬物的VTE予防を検討' : '低リスク（<4点）— 薬物的VTE予防は一般的でない'
    const vteRate = highRisk ? '約11%' : '約0.3%'
    return { score, severity, label, vteRate }
  }, [checks])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Padua Score" value={result.score} unit="/ 20点" interpretation={result.label} severity={result.severity}
        details={[{ label: 'VTE発生率', value: result.vteRate }]} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">Padua Prediction Scoreとは</h2>
          <p>内科入院患者のVTEリスクを評価するスコアです。4点以上で高リスクと判定され、薬物的VTE予防（低分子ヘパリン等）の適応となります。ACCPガイドラインでも示されています。</p>
          <h3 className="font-bold text-tx">判定基準</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>≥ 4点: 高リスク（VTE 11%）→ 薬物的予防を検討</li>
            <li>&lt; 4点: 低リスク（VTE 0.3%）→ 薬物的予防は不要</li>
          </ul>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Barbar S, et al. J Thromb Haemost 2010;8:2450-2457' }]}
    >
      <div className="space-y-2">
        {criteria.map(c => (
          <CheckItem key={c.id} id={c.id} label={c.label} points={c.points}
            checked={checks[c.id]} onChange={v => setChecks(p => ({...p,[c.id]:v}))} />
        ))}
      </div>
    </CalculatorLayout>
  )
}
