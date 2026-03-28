'use client'

import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('nyha')!

const classes = [
  { value: 'I', label: 'I度: 心疾患はあるが、通常の身体活動では症状なし', severity: 'ok' as const },
  { value: 'II', label: 'II度: 通常の身体活動で疲労・動悸・呼吸困難・狭心痛。安静時無症状', severity: 'wn' as const },
  { value: 'III', label: 'III度: 通常以下の身体活動で症状出現。安静時無症状', severity: 'dn' as const },
  { value: 'IV', label: 'IV度: 安静時にも症状あり。いかなる身体活動でも増悪', severity: 'dn' as const },
]

export default function NyhaPage() {
  const [selected, setSelected] = useState('II')

  const cls = classes.find(c => c.value === selected)!

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="NYHA" value={`Class ${cls.value}`} interpretation={cls.label} severity={cls.severity} />}
      explanation={
        <div className="space-y-2 text-sm text-muted">
          <p>HFrEF（EF低下型心不全）の基本薬物療法（Class II-IV）:</p>
          <p>RAS阻害薬（ACE-I, ARB, またはARNIから1剤選択）+ β遮断薬 + MRA + SGLT2i</p>
          <p className="text-xs text-dn font-medium">※ ACE-I/ARBとARNIの併用は禁忌。いずれか1剤を選択すること。</p>
          <p className="text-xs text-muted">（参考情報。処方は心不全専門医が個別に判断）</p>
        </div>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'The Criteria Committee of the NYHA. Diseases of the Heart and Blood Vessels, 6th ed. 1964' }]}
    >
      <div className="space-y-3">
        {classes.map(c => (
          <label key={c.value} className="flex items-start gap-3 cursor-pointer py-1.5">
            <input type="radio" name="nyha" value={c.value} checked={selected === c.value} onChange={() => setSelected(c.value)} className="mt-0.5 w-4 h-4 text-ac" />
            <span className="text-sm text-tx">{c.label}</span>
          </label>
        ))}
      </div>
    </CalculatorLayout>
  )
}
