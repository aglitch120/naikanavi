'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('bishop')!

const categories = [
  { id: 'dilation', label: '子宮口開大', options: [
    { label: '閉鎖 (0)', value: '0' }, { label: '1-2cm (1)', value: '1' },
    { label: '3-4cm (2)', value: '2' }, { label: '≧5cm (3)', value: '3' },
  ]},
  { id: 'effacement', label: '展退度', options: [
    { label: '0-30% (0)', value: '0' }, { label: '40-50% (1)', value: '1' },
    { label: '60-70% (2)', value: '2' }, { label: '≧80% (3)', value: '3' },
  ]},
  { id: 'station', label: '児頭下降度 (Station)', options: [
    { label: '-3 (0)', value: '0' }, { label: '-2 (1)', value: '1' },
    { label: '-1, 0 (2)', value: '2' }, { label: '+1, +2 (3)', value: '3' },
  ]},
  { id: 'consistency', label: '頚管の硬さ', options: [
    { label: '硬 (0)', value: '0' }, { label: '中 (1)', value: '1' }, { label: '軟 (2)', value: '2' },
  ]},
  { id: 'position', label: '頚管の位置', options: [
    { label: '後方 (0)', value: '0' }, { label: '中間 (1)', value: '1' }, { label: '前方 (2)', value: '2' },
  ]},
]

export default function BishopPage() {
  const [vals, setVals] = useState<Record<string, string>>(
    Object.fromEntries(categories.map(c => [c.id, '0']))
  )
  const result = useMemo(() => {
    const score = categories.reduce((sum, c) => sum + parseInt(vals[c.id] || '0'), 0)
    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (score >= 9) { interpretation = '頸管は成熟している（9-13点）'; severity = 'ok' }
    else if (score >= 5) { interpretation = '分娩誘発の成功確率が高い（5-8点）'; severity = 'ok' }
    else { interpretation = '頸管は未成熟である（0-4点）'; severity = 'wn' }
    return { score, interpretation, severity }
  }, [vals])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Bishopスコア" value={`${result.score}`} unit="/ 13点" interpretation={result.interpretation} severity={result.severity}
        details={[
          { label: '9-13点', value: '頸管は成熟している' },
          { label: '5-8点', value: '分娩誘発の成功確率が高い' },
          { label: '0-4点', value: '頸管は未成熟である' },
        ]} />}
      explanation={<div className="text-sm text-muted"><p className="text-xs text-wn">初産婦にのみ適応（経産婦には適用不可）</p></div>}
      references={[{ text: 'Bishop EH. Pelvic scoring for elective induction. Obstet Gynecol 1964;24:266-268' }]}
    >
      <div className="space-y-3">
        {categories.map(c => (
          <SelectInput key={c.id} id={c.id} label={c.label} options={c.options}
            value={vals[c.id]} onChange={v => setVals(p => ({ ...p, [c.id]: v }))} />
        ))}
      </div>
    </CalculatorLayout>
  )
}
