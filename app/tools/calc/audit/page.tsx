'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('audit')!

interface AuditQuestion {
  id: string
  question: string
  options: { label: string; points: number }[]
}

const questions: AuditQuestion[] = [
  {
    id: 'q1', question: '1. アルコール含有飲料をどのくらいの頻度で飲みますか？',
    options: [
      { label: '飲まない', points: 0 }, { label: '月に1度以下', points: 1 },
      { label: '月に2〜4度', points: 2 }, { label: '週に2〜3度', points: 3 },
      { label: '週に4度以上', points: 4 },
    ],
  },
  {
    id: 'q2', question: '2. 飲酒するときは通常どのくらいの量を飲みますか？（ドリンク数）',
    options: [
      { label: '1〜2', points: 0 }, { label: '3〜4', points: 1 },
      { label: '5〜6', points: 2 }, { label: '7〜9', points: 3 },
      { label: '10以上', points: 4 },
    ],
  },
  {
    id: 'q3', question: '3. 1度に6ドリンク以上飲むことがどのくらいの頻度でありますか？',
    options: [
      { label: 'ない', points: 0 }, { label: '月に1度未満', points: 1 },
      { label: '月に1度', points: 2 }, { label: '週に1度', points: 3 },
      { label: 'ほぼ毎日', points: 4 },
    ],
  },
  {
    id: 'q4', question: '4. 過去1年で、飲み始めると止められなかったことが？',
    options: [
      { label: 'ない', points: 0 }, { label: '月に1度未満', points: 1 },
      { label: '月に1度', points: 2 }, { label: '週に1度', points: 3 },
      { label: 'ほぼ毎日', points: 4 },
    ],
  },
  {
    id: 'q5', question: '5. 飲酒のためにやるべきことができなかったことが？',
    options: [
      { label: 'ない', points: 0 }, { label: '月に1度未満', points: 1 },
      { label: '月に1度', points: 2 }, { label: '週に1度', points: 3 },
      { label: 'ほぼ毎日', points: 4 },
    ],
  },
  {
    id: 'q6', question: '6. 大量飲酒の翌朝、迎え酒が必要だったことが？',
    options: [
      { label: 'ない', points: 0 }, { label: '月に1度未満', points: 1 },
      { label: '月に1度', points: 2 }, { label: '週に1度', points: 3 },
      { label: 'ほぼ毎日', points: 4 },
    ],
  },
  {
    id: 'q7', question: '7. 飲酒後に罪悪感や後悔を感じたことが？',
    options: [
      { label: 'ない', points: 0 }, { label: '月に1度未満', points: 1 },
      { label: '月に1度', points: 2 }, { label: '週に1度', points: 3 },
      { label: 'ほぼ毎日', points: 4 },
    ],
  },
  {
    id: 'q8', question: '8. 飲酒のため前夜の出来事を思い出せなかったことが？',
    options: [
      { label: 'ない', points: 0 }, { label: '月に1度未満', points: 1 },
      { label: '月に1度', points: 2 }, { label: '週に1度', points: 3 },
      { label: 'ほぼ毎日', points: 4 },
    ],
  },
  {
    id: 'q9', question: '9. あなたの飲酒のために、あなた自身または他の人がけがをしたことが？',
    options: [
      { label: 'ない', points: 0 }, { label: 'あるが過去1年にはない', points: 2 },
      { label: '過去1年間にあり', points: 4 },
    ],
  },
  {
    id: 'q10', question: '10. 飲酒量を減らすよう勧められたことが？',
    options: [
      { label: 'ない', points: 0 }, { label: 'あるが過去1年にはない', points: 2 },
      { label: '過去1年間にあり', points: 4 },
    ],
  },
]

export default function AuditPage() {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(questions.map(q => [q.id, 0]))
  )

  const result = useMemo(() => {
    const total = Object.values(scores).reduce((a, b) => a + b, 0)

    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    let recommendation = ''
    if (total <= 7) {
      interpretation = '低リスク飲酒'; recommendation = '飲酒教育'; severity = 'ok'
    } else if (total <= 15) {
      interpretation = '危険な飲酒（ハザーダス）'; recommendation = '簡易介入（ブリーフインターベンション）'; severity = 'wn'
    } else if (total <= 19) {
      interpretation = '有害な飲酒（ハームフル）'; recommendation = '簡易介入＋継続モニタリング'; severity = 'wn'
    } else {
      interpretation = 'アルコール依存が疑われる'; recommendation = '専門医療機関への紹介'; severity = 'dn'
    }

    return { total, interpretation, severity, recommendation }
  }, [scores])

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
          label="AUDIT スコア"
          value={result.total}
          unit="/ 40"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: '参考対応', value: result.recommendation },
            { label: '低リスク', value: '0〜7' },
            { label: '危険飲酒', value: '8〜15' },
            { label: '依存疑い', value: '20以上' },
          ]}
        />
      }
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">AUDIT（飲酒スクリーニング）とは</h2>
          <p>WHOが開発した10項目の自記式質問票。危険な飲酒パターンとアルコール依存のスクリーニングに国際的に使用されています。</p>
          <h3 className="font-bold text-tx">スコア解釈</h3>
          <p>0〜7: 低リスク。8〜15: 危険な飲酒（簡易介入が有効）。16〜19: 有害な使用。20以上: アルコール依存が疑われ、専門治療を検討。</p>
          <h3 className="font-bold text-tx">1ドリンクの目安</h3>
          <p>ビール中瓶1本（500mL）、日本酒1合、ワイン2杯（200mL）、ウイスキーダブル1杯がそれぞれ約2ドリンク（純アルコール20g）に相当。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Saunders JB, et al. Addiction 1993;88:791-804' },
        { text: 'WHO. AUDIT: The Alcohol Use Disorders Identification Test, 2nd ed. 2001' },
      ]}
    >
      <div className="space-y-5">
        {questions.map(q => (
          <div key={q.id}>
            <label className="block text-sm font-medium text-tx mb-1">{q.question}</label>
            <select
              value={scores[q.id]}
              onChange={e => setScores(prev => ({ ...prev, [q.id]: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-tx
                         focus:outline-none focus:ring-2 focus:ring-ac/30 focus:border-ac text-sm"
            >
              {q.options.map(opt => (
                <option key={opt.points} value={opt.points}>{opt.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </CalculatorLayout>
  )
}
