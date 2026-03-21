'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('abcd2')!

export default function Abcd2Page() {
  const [age, setAge] = useState('0')       // 0 or 1
  const [bp, setBp] = useState('0')         // 0 or 1
  const [clinical, setClinical] = useState('0') // 0, 1, or 2
  const [duration, setDuration] = useState('0') // 0, 1, or 2
  const [diabetes, setDiabetes] = useState(false)

  const result = useMemo(() => {
    const score = parseInt(age) + parseInt(bp) + parseInt(clinical) + parseInt(duration) + (diabetes ? 1 : 0)

    let risk2d = '', risk7d = '', risk90d = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'

    if (score <= 3) {
      risk2d = '1.0%'; risk7d = '1.2%'; risk90d = '3.1%'; severity = 'ok'
    } else if (score <= 5) {
      risk2d = '4.1%'; risk7d = '5.9%'; risk90d = '9.8%'; severity = 'wn'
    } else {
      risk2d = '8.1%'; risk7d = '11.7%'; risk90d = '17.8%'; severity = 'dn'
    }

    let label = ''
    if (score <= 3) label = '低リスク — 外来フォロー可'
    else if (score <= 5) label = '中リスク — 入院精査を考慮'
    else label = '高リスク — 入院・緊急精査を検討'

    return { score, risk2d, risk7d, risk90d, severity, label }
  }, [age, bp, clinical, duration, diabetes])

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
          label="ABCD² スコア"
          value={result.score}
          unit="/ 7点"
          interpretation={result.label}
          severity={result.severity}
          details={[
            { label: '2日以内の脳梗塞リスク', value: result.risk2d },
            { label: '7日以内', value: result.risk7d },
            { label: '90日以内', value: result.risk90d },
          ]}
        />
      }
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">ABCD²スコアとは</h2>
          <p>TIA（一過性脳虚血発作）後の短期的な脳梗塞リスクを評価するスコアです。合計0〜7点。</p>
          <h3 className="font-bold text-tx">リスク分類</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>0〜3点: 低リスク（2日以内 1.0%）</li>
            <li>4〜5点: 中リスク（2日以内 4.1%）</li>
            <li>6〜7点: 高リスク（2日以内 8.1%）</li>
          </ul>
          <p>※ ABCD²スコア単独での判断は不十分であり、画像所見（DWI陽性、頸動脈狭窄）も考慮すべきです。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Johnston SC et al. Lancet 2007;369:283-292' },
      ]}
    >
      <div className="space-y-4">
        <RadioGroup name="age" label="A: 年齢" value={age} onChange={setAge}
          options={[{ value: '0', label: '< 60歳（0点）' }, { value: '1', label: '≥ 60歳（1点）' }]} />
        <RadioGroup name="bp" label="B: 血圧" value={bp} onChange={setBp}
          options={[{ value: '0', label: 'SBP≤139 かつ DBP≤89（0点）' }, { value: '1', label: 'SBP≥140 or DBP≥90（1点）' }]} />
        <RadioGroup name="clinical" label="C: 臨床症状" value={clinical} onChange={setClinical}
          options={[
            { value: '0', label: 'その他（0点）' },
            { value: '1', label: '片麻痺なしの言語障害（1点）' },
            { value: '2', label: '片麻痺あり（2点）' },
          ]} />
        <RadioGroup name="duration" label="D: 持続時間" value={duration} onChange={setDuration}
          options={[
            { value: '0', label: '< 10分（0点）' },
            { value: '1', label: '10〜59分（1点）' },
            { value: '2', label: '≥ 60分（2点）' },
          ]} />
        <CheckItem id="diabetes" label="D: 糖尿病" sublabel="Diabetes mellitus" points={1} checked={diabetes} onChange={setDiabetes} />
      </div>
    </CalculatorLayout>
  )
}
