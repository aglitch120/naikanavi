'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('gold-copd')!
const spirometry = [
  { value: '1', label: 'GOLD 1 (軽度)', desc: 'FEV1 ≧80%predicted' },
  { value: '2', label: 'GOLD 2 (中等度)', desc: '50% ≦ FEV1 < 80%' },
  { value: '3', label: 'GOLD 3 (重度)', desc: '30% ≦ FEV1 < 50%' },
  { value: '4', label: 'GOLD 4 (最重度)', desc: 'FEV1 < 30%' },
]
const groups = [
  { value: 'A', label: 'A群', desc: '増悪少(0-1回/年,入院なし) + 症状少(mMRC 0-1/CAT<10)' },
  { value: 'B', label: 'B群', desc: '増悪少(0-1回/年,入院なし) + 症状多(mMRC≧2/CAT≧10)' },
  { value: 'E', label: 'E群', desc: '増悪多(≧2回/年 or ≧1回入院)' },
]
export default function GOLDCOPDPage() {
  const [spiro, setSpiro] = useState('2')
  const [group, setGroup] = useState('A')
  const sev = spiro === '1' ? 'ok' as const : spiro === '2' ? 'wn' as const : 'dn' as const
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="GOLD分類" value={`GOLD ${spiro} / ${group}群`} interpretation={`GOLD 2024分類。治療方針は担当医が個別に判断`} severity={sev} />}
      explanation={undefined}
      relatedTools={[]} references={[{ text: 'GOLD 2024 Report. Global Initiative for Chronic Obstructive Lung Disease' }]}
    >
      <div className="space-y-4">
        <fieldset>
          <legend className="block text-sm font-medium text-tx mb-2">気流制限（スパイロメトリー）</legend>
          <div className="space-y-1.5">
            {spirometry.map(g => (
              <button key={g.value} onClick={() => setSpiro(g.value)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${spiro === g.value ? 'border-ac bg-ac/10 text-ac font-semibold' : 'border-br bg-s0 text-tx hover:border-ac/30'}`}>
                <span className="font-bold">{g.label}</span><span className="text-muted ml-1.5">{g.desc}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="block text-sm font-medium text-tx mb-2">ABE群（症状+増悪頻度）</legend>
          <div className="space-y-1.5">
            {groups.map(g => (
              <button key={g.value} onClick={() => setGroup(g.value)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${group === g.value ? 'border-ac bg-ac/10 text-ac font-semibold' : 'border-br bg-s0 text-tx hover:border-ac/30'}`}>
                <span className="font-bold">{g.label}:</span><span className="ml-1.5">{g.desc}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </CalculatorLayout>
  )
}
