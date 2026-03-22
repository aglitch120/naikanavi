'use client'

import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('mrs')!

const grades = [
  { value: 0, label: '0: まったく症候がない', detail: '完全に活動的で症状なし', severity: 'ok' as const },
  { value: 1, label: '1: 症候はあるが障害はない', detail: '日常の活動・仕事がすべてこなせる', severity: 'ok' as const },
  { value: 2, label: '2: 軽度の障害', detail: '発症前の活動がすべてはできないが、介助なしで身の回りのことができる', severity: 'ok' as const },
  { value: 3, label: '3: 中等度の障害', detail: '何らかの介助を要するが、歩行は介助なしで可能', severity: 'wn' as const },
  { value: 4, label: '4: 中等度〜重度の障害', detail: '歩行や身体的欲求に介助が必要', severity: 'wn' as const },
  { value: 5, label: '5: 重度の障害', detail: '寝たきり、常に介護が必要', severity: 'dn' as const },
  { value: 6, label: '6: 死亡', detail: '', severity: 'dn' as const },
]

export default function MrsPage() {
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
          label="modified Rankin Scale"
          value={`mRS ${result.value}`}
          interpretation={result.label.replace(/^\d: /, '')}
          severity={result.severity}
          details={[
            ...(result.detail ? [{ label: '定義', value: result.detail }] : []),
            { label: '転帰', value: result.value <= 2 ? '良好（favorable）' : '不良（unfavorable）' },
          ]}
        />
      )}
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'van Swieten JC et al. Stroke 1988;19:604-607' },
        { text: 'Banks JL, Marotta CA. Stroke 2007;38:1091-1096' },
      ]}
    >
      <div className="space-y-2">
        {grades.map(g => (
          <label
            key={g.value}
            className={`block p-3 rounded-lg border cursor-pointer transition-colors
              ${selected === g.value ? 'bg-acl border-ac/30' : 'bg-bg border-br hover:border-ac/20'}`}
          >
            <input type="radio" name="mrs" value={g.value} checked={selected === g.value}
              onChange={() => setSelected(g.value)} className="sr-only" />
            <span className="text-sm font-medium text-tx">{g.label}</span>
            {g.detail && <span className="block text-xs text-muted mt-0.5">{g.detail}</span>}
          </label>
        ))}
      </div>
    </CalculatorLayout>
  )
}
