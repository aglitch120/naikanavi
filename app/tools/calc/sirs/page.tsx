'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('sirs')!

const items = [
  { id: 'temp', label: '体温 > 38℃ または < 36℃' },
  { id: 'hr', label: '心拍数 > 90回/分' },
  { id: 'rr', label: '呼吸数 > 20回/分 または PaCO₂ < 32 mmHg' },
  { id: 'wbc', label: 'WBC > 12,000/μL または < 4,000/μL または 桿状核球 > 10%' },
]

export default function SirsPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const result = useMemo(() => {
    const score = Object.values(checked).filter(Boolean).length
    const isSirs = score >= 2
    return {
      score,
      interpretation: isSirs ? `SIRS（${score}/4項目該当）— 感染源の検索を` : `SIRS基準未達（${score}/4）`,
      severity: (isSirs ? 'dn' : 'ok') as 'ok' | 'wn' | 'dn',
    }
  }, [checked])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="SIRS" value={result.score} unit="/ 4" interpretation={result.interpretation} severity={result.severity}
        details={[{ label: '基準', value: '4項目中2項目以上でSIRS' }]} />}
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Bone RC, et al. Chest 1992;101:1644-1655' }, { text: 'Singer M, et al. JAMA 2016;315:801-810 (Sepsis-3)' }]}
    >
      <div className="space-y-3">
        {items.map(item => (
          <label key={item.id} className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={!!checked[item.id]} onChange={e => setChecked(prev => ({ ...prev, [item.id]: e.target.checked }))} className="w-4 h-4 rounded border-br text-ac focus:ring-ac/30" />
            <span className="text-sm text-tx">{item.label}</span>
          </label>
        ))}
      </div>
    </CalculatorLayout>
  )
}
