'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('gad7')!

const questions = [
  '緊張、不安、またはピリピリする感じ',
  '心配することを止められない、またはコントロールできない',
  'いろいろなことを心配しすぎる',
  'くつろぐことが難しい',
  'じっとしていられないほど落ち着かない',
  '怒りっぽくなる、またはイライラしやすい',
  '何か恐ろしいことが起こるのではないかと怖くなる',
]
const opts = [
  { value: '0', label: '0 — 全くない' },
  { value: '1', label: '1 — 数日' },
  { value: '2', label: '2 — 半分以上' },
  { value: '3', label: '3 — ほぼ毎日' },
]

export default function Gad7Page() {
  const [scores, setScores] = useState<string[]>(questions.map(() => '0'))
  const result = useMemo(() => {
    const total = scores.reduce((a, b) => a + parseInt(b), 0)
    let label = '', severity: 'ok'|'wn'|'dn' = 'ok'
    if (total <= 4) { label = '不安症状なし〜最小限'; severity = 'ok' }
    else if (total <= 9) { label = '軽度不安'; severity = 'ok' }
    else if (total <= 14) { label = '中等度不安 — 治療を検討'; severity = 'wn' }
    else { label = '重度不安 — 積極的治療が必要'; severity = 'dn' }
    return { total, severity, label }
  }, [scores])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="GAD-7" value={result.total} unit="/ 21点" interpretation={result.label} severity={result.severity} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">GAD-7とは</h2>
          <p>Generalized Anxiety Disorder 7-item scaleは全般性不安障害の重症度評価に使用される自記式スクリーニングツールです。カットオフ10点で感度89%・特異度82%と報告されています。</p>
          <h3 className="font-bold text-tx">重症度分類</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>0-4: 最小限</li><li>5-9: 軽度</li><li>10-14: 中等度</li><li>15-21: 重度</li>
          </ul>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Spitzer RL, et al. Arch Intern Med 2006;166:1092-1097' }]}
    >
      <div className="space-y-4">
        <p className="text-xs text-muted">過去2週間にわたり、以下の問題にどのくらい悩まされましたか？</p>
        {questions.map((q, i) => (
          <SelectInput key={i} id={`q${i}`} label={`${i + 1}. ${q}`} value={scores[i]}
            onChange={v => setScores(prev => { const n = [...prev]; n[i] = v; return n })} options={opts} />
        ))}
      </div>
    </CalculatorLayout>
  )
}
