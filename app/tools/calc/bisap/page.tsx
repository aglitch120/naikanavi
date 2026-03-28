'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('bisap')!

const items = [
  { id: 'bun', label: 'BUN > 25 mg/dL' },
  { id: 'impaired', label: '意識障害（GCS < 15）' },
  { id: 'sirs', label: 'SIRS（2項目以上該当）', hint: '体温>38/<36, HR>90, RR>20/PaCO2<32, WBC>12000/<4000' },
  { id: 'age', label: '年齢 > 60歳' },
  { id: 'effusion', label: '胸水あり（画像所見）' },
]

export default function BisapPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const result = useMemo(() => {
    const score = Object.values(checked).filter(Boolean).length

    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    let mortality = ''
    if (score <= 1) { interpretation = '低リスク'; mortality = '死亡率 < 2%'; severity = 'ok' }
    else if (score === 2) { interpretation = '中リスク'; mortality = '死亡率 約4%'; severity = 'wn' }
    else if (score === 3) { interpretation = '高リスク'; mortality = '死亡率 約13%'; severity = 'dn' }
    else { interpretation = '最高リスク'; mortality = '死亡率 > 20%'; severity = 'dn' }

    return { score, interpretation, severity, mortality }
  }, [checked])

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
          label="BISAP スコア"
          value={result.score}
          unit="/ 5"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: '予測死亡率', value: result.mortality },
            { label: '≧ 3点', value: '重症膵炎・臓器不全リスク高' },
          ]}
        />
      }
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Wu BU, et al. Gut 2008;57:1698-1703' },
        { text: 'Papachristou GI, et al. Am J Gastroenterol 2010;105:435-441' },
      ]}
    >
      <div className="space-y-4">
        {items.map(item => (
          <label key={item.id} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!checked[item.id]}
              onChange={e => setChecked(prev => ({ ...prev, [item.id]: e.target.checked }))}
              className="w-4 h-4 mt-0.5 rounded border-br text-ac focus:ring-ac/30"
            />
            <div>
              <span className="text-sm text-tx">{item.label}</span>
              {'hint' in item && item.hint && <p className="text-xs text-muted">{item.hint}</p>}
            </div>
          </label>
        ))}
      </div>
    </CalculatorLayout>
  )
}
