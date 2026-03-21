'use client'

import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('ecog')!

const grades = [
  { value: 0, label: 'PS 0: 無症状', detail: '発症前と同等の日常生活が制限なく行える', severity: 'ok' as const },
  { value: 1, label: 'PS 1: 軽度の症状', detail: '歩行可能で軽作業は可能。激しい活動は制限', severity: 'ok' as const },
  { value: 2, label: 'PS 2: 中等度', detail: '歩行・身の回りのことは可能。日中の50%以上は起居', severity: 'wn' as const },
  { value: 3, label: 'PS 3: 重度', detail: '身の回りのことは限定的。日中の50%以上をベッド/椅子で過ごす', severity: 'wn' as const },
  { value: 4, label: 'PS 4: 全介助', detail: '完全に動けない。身の回りのことができない。寝たきり', severity: 'dn' as const },
  { value: 5, label: 'PS 5: 死亡', detail: '', severity: 'dn' as const },
]

const kpsMapping: Record<number, string> = {
  0: '100%〜90%',
  1: '80%〜70%',
  2: '60%〜50%',
  3: '40%〜30%',
  4: '20%〜10%',
  5: '0%',
}

export default function EcogPage() {
  const [selected, setSelected] = useState<number | null>(null)

  const result = selected !== null ? grades[selected] : null

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
          label="ECOG Performance Status"
          value={`PS ${result.value}`}
          interpretation={result.label.replace(/^PS \d: /, '')}
          severity={result.severity}
          details={[
            { label: '定義', value: result.detail },
            { label: 'Karnofsky PS換算', value: `約${kpsMapping[result.value]}` },
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">ECOG PS（Performance Status）とは</h2>
          <p>ECOG（Eastern Cooperative Oncology Group）PSはがん患者の全身状態を0〜5の6段階で評価する指標です。治療方針の決定、臨床試験の適格基準、予後予測に使用されます。</p>
          <h3 className="font-bold text-tx">臨床での使い方</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>PS 0〜1: 積極的な化学療法の適応</li>
            <li>PS 2: 治療の利益と害を慎重に判断</li>
            <li>PS 3〜4: 緩和医療中心（BSCを考慮）</li>
          </ul>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Oken MM et al. Am J Clin Oncol 1982;5:649-655' },
      ]}
    >
      <div className="space-y-2">
        {grades.map(g => (
          <label
            key={g.value}
            className={`block p-3 rounded-lg border cursor-pointer transition-colors
              ${selected === g.value ? 'bg-acl border-ac/30' : 'bg-bg border-br hover:border-ac/20'}`}
          >
            <input type="radio" name="ecog" value={g.value} checked={selected === g.value}
              onChange={() => setSelected(g.value)} className="sr-only" />
            <span className="text-sm font-medium text-tx">{g.label}</span>
            {g.detail && <span className="block text-xs text-muted mt-0.5">{g.detail}</span>}
          </label>
        ))}
      </div>
    </CalculatorLayout>
  )
}
