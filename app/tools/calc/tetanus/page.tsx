'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('tetanus')!

// ACS創分類: 破傷風リスクが高い創 vs 低い創
const woundTypes = [
  { label: 'リスクが低い創（清潔・小さい創）', value: 'low' },
  { label: 'リスクが高い創（汚染・深い・壊死組織・穿通・開放骨折・熱傷・凍傷など）', value: 'high' },
]
const vaccineHistory = [
  { label: '接種歴不明 or 3回未満', value: 'under3' },
  { label: '3回以上（最終接種から5年以内）', value: 'within5' },
  { label: '3回以上（最終接種から5年超〜10年以内）', value: '5to10' },
  { label: '3回以上（最終接種から10年超）', value: 'over10' },
]

export default function TetanusPage() {
  const [wound, setWound] = useState('low')
  const [vaccine, setVaccine] = useState('within5')

  const result = useMemo(() => {
    const highRisk = wound === 'high'

    if (vaccine === 'under3') {
      // 不明 or <3回: トキソイド3回接種が必要。高リスク創ならTIGも
      return {
        severity: 'dn' as const,
        toxoid: true,
        tig: highRisk,
        label: highRisk
          ? 'TIG投与 + 破傷風トキソイド3回接種'
          : '破傷風トキソイド3回接種（TIG不要）',
        schedule: '受傷時に1回目 → 3-8週後に2回目 → 6-18ヶ月後に3回目',
      }
    }

    if (highRisk) {
      // 高リスク創 + 3回以上: 最終接種から5年超ならトキソイド1回
      if (vaccine === '5to10' || vaccine === 'over10') {
        return {
          severity: 'wn' as const,
          toxoid: true,
          tig: false,
          label: '破傷風トキソイド1回接種',
          schedule: '※免疫不全状態の場合は接種歴に関わらずTIG使用を検討',
        }
      }
      // 5年以内: 不要
      return { severity: 'ok' as const, toxoid: false, tig: false, label: '接種不要', schedule: '' }
    }

    // 低リスク創 + 3回以上: 最終接種から10年超ならトキソイド1回
    if (vaccine === 'over10') {
      return { severity: 'wn' as const, toxoid: true, tig: false, label: '破傷風トキソイド1回接種', schedule: '' }
    }
    return { severity: 'ok' as const, toxoid: false, tig: false, label: '接種不要', schedule: '' }
  }, [wound, vaccine])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={
        <div className="space-y-2">
          <ResultCard label="破傷風予防" value={result.label} severity={result.severity}
            details={[
              ...(result.toxoid ? [{ label: 'トキソイド', value: '要' }] : []),
              ...(result.tig ? [{ label: 'TIG（抗破傷風ヒト免疫グロブリン）', value: '要' }] : []),
              ...(result.schedule ? [{ label: '接種スケジュール', value: result.schedule }] : []),
            ]} />
        </div>
      }
      explanation={<div className="text-sm text-muted space-y-2">
        <p>破傷風抗毒素抗体価は約10年で発症防御レベルを下回る。接種歴（回数・最終接種時期）の聴取が重要。</p>
        <div className="bg-s0 p-3 rounded-lg border border-br text-xs space-y-1">
          <p className="font-bold text-tx">ACS創分類の目安</p>
          <p>リスクが高い創: 汚染創（土壌・糞便・唾液）、穿通創、開放骨折、挫滅創、熱傷・凍傷、壊死組織を含む創、6時間以上経過した創</p>
          <p>リスクが低い創: 上記に該当しない清潔で小さな創</p>
        </div>
      </div>}
      relatedTools={[]}
      references={[
        { text: 'CDC. Epidemiology and Prevention of Vaccine-Preventable Diseases (Pink Book). 14th ed, 2021' },
        { text: 'ACS Committee on Trauma. Advanced Trauma Life Support (ATLS). 10th ed' },
      ]}
    >
      <div className="space-y-4">
        <RadioGroup id="wound" label="創の性状（ACS分類）" options={woundTypes} value={wound} onChange={setWound} />
        <RadioGroup id="vaccine" label="破傷風ワクチン接種歴" options={vaccineHistory} value={vaccine} onChange={setVaccine} />
      </div>
    </CalculatorLayout>
  )
}
