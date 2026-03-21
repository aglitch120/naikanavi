'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('ranson')!

interface CriteriaItem {
  id: string
  label: string
  group: 'admission' | '48h'
}

const items: CriteriaItem[] = [
  { id: 'age', label: '年齢 > 55歳', group: 'admission' },
  { id: 'wbc', label: 'WBC > 16,000/μL', group: 'admission' },
  { id: 'glucose', label: '血糖 > 200 mg/dL', group: 'admission' },
  { id: 'ldh', label: 'LDH > 350 IU/L', group: 'admission' },
  { id: 'ast', label: 'AST > 250 IU/L', group: 'admission' },
  { id: 'hct', label: 'Hct低下 > 10%', group: '48h' },
  { id: 'bun', label: 'BUN上昇 > 5 mg/dL', group: '48h' },
  { id: 'ca', label: 'Ca < 8 mg/dL', group: '48h' },
  { id: 'pao2', label: 'PaO2 < 60 mmHg', group: '48h' },
  { id: 'base', label: 'Base deficit > 4 mEq/L', group: '48h' },
  { id: 'fluid', label: '輸液量 > 6L/48h', group: '48h' },
]

export default function RansonPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const result = useMemo(() => {
    const score = Object.values(checked).filter(Boolean).length
    const admissionCount = items.filter(i => i.group === 'admission' && checked[i.id]).length
    const h48Count = items.filter(i => i.group === '48h' && checked[i.id]).length

    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    let mortality = ''
    if (score <= 2) { interpretation = '軽症膵炎'; mortality = '死亡率 < 5%'; severity = 'ok' }
    else if (score <= 4) { interpretation = '中等症膵炎'; mortality = '死亡率 15〜20%'; severity = 'wn' }
    else if (score <= 6) { interpretation = '重症膵炎'; mortality = '死亡率 40%'; severity = 'dn' }
    else { interpretation = '最重症膵炎'; mortality = '死亡率 > 99%'; severity = 'dn' }

    return { score, admissionCount, h48Count, interpretation, severity, mortality }
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
          label="Ranson スコア"
          value={result.score}
          unit="/ 11"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: '予測死亡率', value: result.mortality },
            { label: '入院時項目', value: `${result.admissionCount} / 5` },
            { label: '48時間後項目', value: `${result.h48Count} / 6` },
          ]}
        />
      }
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">Ranson基準とは</h2>
          <p>急性膵炎の重症度を予測する古典的スコア。入院時5項目と48時間後6項目の計11項目で評価します。3点以上で重症膵炎と判定。</p>
          <h3 className="font-bold text-tx">制限事項</h3>
          <p>完全な評価に48時間を要する点が欠点。入院時の早期評価にはBISAPスコアがより実用的とされます。アルコール性と胆石性で基準値が若干異なりますが、本ツールではアルコール性（原法）を使用しています。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Ranson JH, et al. Surg Gynecol Obstet 1974;139:69-81' },
      ]}
    >
      <div className="space-y-4">
        <p className="text-sm font-semibold text-tx">入院時（5項目）</p>
        {items.filter(i => i.group === 'admission').map(item => (
          <label key={item.id} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!checked[item.id]}
              onChange={e => setChecked(prev => ({ ...prev, [item.id]: e.target.checked }))}
              className="w-4 h-4 rounded border-br text-ac focus:ring-ac/30"
            />
            <span className="text-sm text-tx">{item.label}</span>
          </label>
        ))}
        <p className="text-sm font-semibold text-tx pt-2">48時間後（6項目）</p>
        {items.filter(i => i.group === '48h').map(item => (
          <label key={item.id} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!checked[item.id]}
              onChange={e => setChecked(prev => ({ ...prev, [item.id]: e.target.checked }))}
              className="w-4 h-4 rounded border-br text-ac focus:ring-ac/30"
            />
            <span className="text-sm text-tx">{item.label}</span>
          </label>
        ))}
      </div>
    </CalculatorLayout>
  )
}
