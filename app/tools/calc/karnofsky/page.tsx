'use client'

import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('karnofsky')!

const grades = [
  { value: 100, label: '100%: 正常、症状なし', severity: 'ok' as const },
  { value: 90, label: '90%: 軽微な症状、通常の活動が可能', severity: 'ok' as const },
  { value: 80, label: '80%: かなりの症状があるが努力すれば正常に活動可能', severity: 'ok' as const },
  { value: 70, label: '70%: 自分の身の回りのことはできるが、通常の活動・仕事は不可能', severity: 'wn' as const },
  { value: 60, label: '60%: 自分に必要なことはできるが、時に介助が必要', severity: 'wn' as const },
  { value: 50, label: '50%: 頻繁に医療的ケアが必要', severity: 'wn' as const },
  { value: 40, label: '40%: 動けない、適切な医療・介助が必要', severity: 'dn' as const },
  { value: 30, label: '30%: 重症、入院が必要', severity: 'dn' as const },
  { value: 20, label: '20%: 非常に重症、積極的な支持療法が必要', severity: 'dn' as const },
  { value: 10, label: '10%: 瀕死', severity: 'dn' as const },
  { value: 0, label: '0%: 死亡', severity: 'dn' as const },
]

export default function KarnofskyPage() {
  const [selected, setSelected] = useState<number | null>(null)

  const result = selected !== null ? grades.find(g => g.value === selected)! : null

  let ecogEquiv = ''
  if (selected !== null) {
    if (selected >= 90) ecogEquiv = 'ECOG PS 0'
    else if (selected >= 70) ecogEquiv = 'ECOG PS 1'
    else if (selected >= 50) ecogEquiv = 'ECOG PS 2'
    else if (selected >= 30) ecogEquiv = 'ECOG PS 3'
    else if (selected >= 10) ecogEquiv = 'ECOG PS 4'
    else ecogEquiv = 'ECOG PS 5'
  }

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
          label="Karnofsky Performance Status"
          value={`${result.value}%`}
          interpretation={result.label.replace(/^\d+%: /, '')}
          severity={result.severity}
          details={[
            { label: 'ECOG PS換算', value: ecogEquiv },
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">Karnofsky Performance Status（KPS）とは</h2>
          <p>KPSはがん患者の全身状態を100%（正常）から0%（死亡）まで10%刻みで評価するスケールです。ECOG PSと並んで広く使用されています。</p>
          <h3 className="font-bold text-tx">KPSとECOG PSの対応</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>KPS 100〜90% ≒ ECOG PS 0</li>
            <li>KPS 80〜70% ≒ ECOG PS 1</li>
            <li>KPS 60〜50% ≒ ECOG PS 2</li>
            <li>KPS 40〜30% ≒ ECOG PS 3</li>
            <li>KPS 20〜10% ≒ ECOG PS 4</li>
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
        { text: 'Karnofsky DA et al. Cancer 1948;1:634-656' },
      ]}
    >
      <div className="space-y-2">
        {grades.map(g => (
          <label
            key={g.value}
            className={`block p-3 rounded-lg border cursor-pointer transition-colors
              ${selected === g.value ? 'bg-acl border-ac/30' : 'bg-bg border-br hover:border-ac/20'}`}
          >
            <input type="radio" name="kps" value={g.value} checked={selected === g.value}
              onChange={() => setSelected(g.value)} className="sr-only" />
            <span className="text-sm font-medium text-tx">{g.label}</span>
          </label>
        ))}
      </div>
    </CalculatorLayout>
  )
}
