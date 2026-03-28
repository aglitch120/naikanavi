'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('borg-scale')!
const levels = [
  { value: '0', label: '0', desc: '何も感じない' },
  { value: '0.5', label: '0.5', desc: '非常に弱い' },
  { value: '1', label: '1', desc: '非常に軽い (Very light)' },
  { value: '2', label: '2', desc: '弱い' },
  { value: '3', label: '3', desc: '中程度' },
  { value: '4', label: '4', desc: 'やや強い' },
  { value: '5', label: '5', desc: '強い' },
  { value: '6', label: '6', desc: '強い〜非常に強い（中間値）' },
  { value: '7', label: '7', desc: '非常に強い' },
  { value: '8', label: '8', desc: '非常に強い〜最大' },
  { value: '9', label: '9', desc: 'ほぼ最大' },
  { value: '10', label: '10', desc: '最大' },
]
export default function BorgPage() {
  const [val, setVal] = useState('0')
  const v = Number(val)
  const sev = v <= 3 ? 'ok' as const : v <= 6 ? 'wn' as const : 'dn' as const
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="修正Borg" value={val} unit="/10" interpretation={v <= 3 ? '軽度' : v <= 6 ? '中等度' : '高度'} severity={sev} />}
      explanation={undefined}
      relatedTools={[]} references={[{ text: 'Borg GA. Med Sci Sports Exerc 1982;14:377-381' }]}
    >
      <fieldset>
        <legend className="block text-sm font-medium text-tx mb-2">息切れの程度</legend>
        <div className="space-y-1.5">
          {levels.map(g => (
            <button key={g.value} onClick={() => setVal(g.value)}
              className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${val === g.value ? 'border-ac bg-ac/10 text-ac font-semibold' : 'border-br bg-s0 text-tx hover:border-ac/30'}`}>
              <span className="font-bold mr-2">{g.label}</span>{g.desc}
            </button>
          ))}
        </div>
      </fieldset>
    </CalculatorLayout>
  )
}