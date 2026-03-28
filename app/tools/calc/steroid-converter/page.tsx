'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('steroid-converter')!

interface Steroid {
  id: string
  name: string
  nameEn: string
  equivalentDose: number // mg（PSL換算1mg相当）
  mineralocorticoid: string
  halfLife: string
  duration: string
}

const steroids: Steroid[] = [
  { id: 'psl', name: 'プレドニゾロン（PSL）', nameEn: 'Prednisolone', equivalentDose: 5, mineralocorticoid: '+', halfLife: '12-36h（生物学的半減期）', duration: '中間型' },
  { id: 'mpsl', name: 'メチルプレドニゾロン（mPSL）', nameEn: 'Methylprednisolone', equivalentDose: 4, mineralocorticoid: '0', halfLife: '12-36h', duration: '中間型' },
  { id: 'dex', name: 'デキサメタゾン（DEX）', nameEn: 'Dexamethasone', equivalentDose: 0.75, mineralocorticoid: '0', halfLife: '36-72h', duration: '長時間型' },
  { id: 'bet', name: 'ベタメタゾン（BET）', nameEn: 'Betamethasone', equivalentDose: 0.6, mineralocorticoid: '0', halfLife: '36-72h', duration: '長時間型' },
  { id: 'hc', name: 'ヒドロコルチゾン（HC）', nameEn: 'Hydrocortisone', equivalentDose: 20, mineralocorticoid: '++', halfLife: '8-12h', duration: '短時間型' },
  { id: 'cortisone', name: 'コルチゾン', nameEn: 'Cortisone', equivalentDose: 25, mineralocorticoid: '++', halfLife: '8-12h', duration: '短時間型' },
  { id: 'triamcinolone', name: 'トリアムシノロン', nameEn: 'Triamcinolone', equivalentDose: 4, mineralocorticoid: '0', halfLife: '12-36h', duration: '中間型' },
]

export default function SteroidConverterPage() {
  const [fromId, setFromId] = useState('psl')
  const [dose, setDose] = useState('30')

  const result = useMemo(() => {
    const d = parseFloat(dose) || 0
    const from = steroids.find(s => s.id === fromId)!
    const pslEquiv = d / from.equivalentDose * 5

    const conversions = steroids.map(s => ({
      ...s,
      convertedDose: parseFloat((d / from.equivalentDose * s.equivalentDose).toFixed(2)),
    }))

    return { pslEquiv: pslEquiv.toFixed(1), conversions, from }
  }, [fromId, dose])

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
          label="PSL換算"
          value={result.pslEquiv}
          unit="mg"
          interpretation={`${result.from.name} ${dose} mg の抗炎症作用等価用量（※ミネラルコルチコイド作用・骨代謝への影響は薬剤により異なる。用途に応じた調整は担当医が判断）`}
          severity="neutral"
        />
      }
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Liu D, et al. Allergy Asthma Clin Immunol 2013;9:30' },
        { text: 'UpToDate: Glucocorticoid effects and equivalencies' },
      ]}
    >
      <div className="space-y-4">
        <SelectInput
          id="from-steroid"
          label="変換元のステロイド"
          value={fromId}
          onChange={setFromId}
          options={steroids.map(s => ({ value: s.id, label: s.name }))}
        />
        <NumberInput id="dose" label="投与量" unit="mg" value={dose} onChange={setDose} step={0.5} />

        {/* 換算結果テーブル */}
        <div className="mt-4 border border-br rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-s1">
              <tr>
                <th className="text-left px-3 py-2 text-tx font-medium">薬剤</th>
                <th className="text-right px-3 py-2 text-tx font-medium">等価用量</th>
                <th className="text-right px-3 py-2 text-tx font-medium hidden sm:table-cell">MC作用</th>
                <th className="text-right px-3 py-2 text-tx font-medium hidden sm:table-cell">作用時間</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-br">
              {result.conversions.map(s => (
                <tr key={s.id} className={s.id === fromId ? 'bg-acl' : ''}>
                  <td className="px-3 py-2 text-tx">
                    <div>{s.name}</div>
                    <div className="text-xs text-muted sm:hidden">MC: {s.mineralocorticoid} / {s.duration}</div>
                  </td>
                  <td className="text-right px-3 py-2 font-mono font-medium text-tx tabular-nums">
                    {s.convertedDose} mg
                  </td>
                  <td className="text-right px-3 py-2 text-muted hidden sm:table-cell">{s.mineralocorticoid}</td>
                  <td className="text-right px-3 py-2 text-muted hidden sm:table-cell">{s.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CalculatorLayout>
  )
}
