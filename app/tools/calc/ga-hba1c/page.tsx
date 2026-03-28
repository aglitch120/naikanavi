'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('ga-hba1c')!
export default function GaHba1cPage() {
  const [mode, setMode] = useState<'ga-to-hba1c' | 'hba1c-to-ga'>('ga-to-hba1c')
  const [value, setValue] = useState('21')
  const result = useMemo(() => {
    const v = parseFloat(value)
    if (!v) return null
    if (mode === 'ga-to-hba1c') {
      const hba1c = (v + 1.73) / 3.6
      return { label: `推定HbA1c ≒ ${hba1c.toFixed(1)}%`, sub: `GA ${v}% → HbA1c ${hba1c.toFixed(1)}%` }
    } else {
      const ga = 3.6 * v - 1.73
      return { label: `推定GA ≒ ${ga.toFixed(1)}%`, sub: `HbA1c ${v}% → GA ${ga.toFixed(1)}%` }
    }
  }, [mode, value])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity="ok" value={result.label} interpretation={result.sub + '\n\n※ GA ≒ 3.6 × HbA1c − 1.73 (Furusyo式)\nGA反映期間: 過去約2-3週間（Alb半減期≒17日）\n透析・貧血・異常Hb症ではHbA1cが不正確 → GAを使用'} /> : null}
      explanation={<div className="space-y-2 text-sm text-muted"><p><strong className="text-tx">換算式:</strong> GA = 3.6 × HbA1c − 1.73 (Furusyo N, et al.)</p><p><strong className="text-tx">GA反映期間:</strong> 過去約2-3週間（アルブミン半減期≒17日。HbA1cは過去1-2ヶ月）</p><p><strong className="text-tx">GAが有用な場面:</strong> 透析患者、貧血、異常Hb症、急速な血糖変動の評価</p></div>}
      relatedTools={[{ slug: 'hba1c-glucose', name: 'HbA1c↔平均血糖' }, { slug: 'homa', name: 'HOMA-IR/β' }, { slug: 'cpi-index', name: 'CPI' }]}
      references={toolDef.sources || []}
    >
      <div className="flex gap-2 mb-2">
        <button onClick={() => { setMode('ga-to-hba1c'); setValue('21') }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'ga-to-hba1c' ? 'bg-ac text-white' : 'bg-s1 text-muted'}`}>GA → HbA1c</button>
        <button onClick={() => { setMode('hba1c-to-ga'); setValue('7.0') }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'hba1c-to-ga' ? 'bg-ac text-white' : 'bg-s1 text-muted'}`}>HbA1c → GA</button>
      </div>
      <NumberInput label={mode === 'ga-to-hba1c' ? 'GA (%)' : 'HbA1c (%)'} value={value} onChange={setValue} step={0.1} />
    </CalculatorLayout>
  )
}
