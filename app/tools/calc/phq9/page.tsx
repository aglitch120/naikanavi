'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('phq9')!

const questions = [
  '物事に対してほとんど興味がない、または楽しめない',
  '気分が落ち込む、憂うつになる、または絶望的な気持ちになる',
  '寝つきが悪い、途中で目がさめる、または逆に眠りすぎる',
  '疲れた感じがする、または気力がない',
  '食欲がない、または食べ過ぎる',
  '自分はダメな人間だ、人生の敗者だと気に病む',
  '新聞を読む、テレビを見るなどに集中することが難しい',
  '動きや話し方が遅くなった、またはじっとしていられない',
  '死んだ方がましだ、あるいは自分を何らかの方法で傷つけようと思った',
]

const opts = [
  { value: '0', label: '0 — 全くない' },
  { value: '1', label: '1 — 数日' },
  { value: '2', label: '2 — 半分以上' },
  { value: '3', label: '3 — ほぼ毎日' },
]

export default function Phq9Page() {
  const [scores, setScores] = useState<string[]>(questions.map(() => '0'))

  const result = useMemo(() => {
    const total = scores.reduce((a, b) => a + parseInt(b), 0)
    let label = '', severity: 'ok'|'wn'|'dn' = 'ok'
    if (total <= 4) { label = '症状なし〜最小限'; severity = 'ok' }
    else if (total <= 9) { label = '軽度うつ病'; severity = 'ok' }
    else if (total <= 14) { label = '中等度うつ病 — 治療を検討'; severity = 'wn' }
    else if (total <= 19) { label = '中等度〜重度うつ病 — 治療を検討'; severity = 'dn' }
    else { label = '重度うつ病 — 積極的治療が必要'; severity = 'dn' }
    const q9 = parseInt(scores[8]) > 0
    return { total, severity, label, q9 }
  }, [scores])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="PHQ-9" value={result.total} unit="/ 27点" interpretation={result.label} severity={result.severity}
        details={result.q9 ? [{ label: '⚠ 希死念慮', value: '問9が1点以上 — 安全性の評価が必要' }] : []} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">PHQ-9とは</h2>
          <p>Patient Health Questionnaire-9はDSM基準に基づくうつ病の自記式スクリーニングツールです。プライマリケアでのうつ病スクリーニングや治療効果の経時的評価に広く使用されます。</p>
          <h3 className="font-bold text-tx">重症度分類</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>0-4: 症状なし〜最小限</li>
            <li>5-9: 軽度</li>
            <li>10-14: 中等度（治療検討）</li>
            <li>15-19: 中等度〜重度（治療を検討）</li>
            <li>20-27: 重度（積極的治療）</li>
          </ul>
          <p className="font-medium text-tx">問9（希死念慮）が1点以上の場合は必ず安全性の評価を行ってください。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Kroenke K, et al. J Gen Intern Med 2001;16:606-613' }]}
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
