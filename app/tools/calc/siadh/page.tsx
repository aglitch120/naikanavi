'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('siadh')!

const essentialItems = [
  { id: 'hyponatremia', label: '血漿Na <135 mEq/L + 血漿浸透圧 <280 mOsm/kg（低張性低Na血症）' },
  { id: 'urine_conc', label: '尿浸透圧 > 100 mOsm/kg（不適切な尿濃縮）' },
  { id: 'urine_na', label: '尿中Na > 20-30 mEq/L（正常食塩摂取下）' },
  { id: 'euvolemic', label: '臨床的に体液量正常（浮腫なし・脱水なし）' },
]
const exclusionItem = { id: 'exclude', label: '甲状腺機能低下症・副腎不全・利尿薬使用・心不全・肝硬変・腎不全を除外済み' }

export default function Page() {
  const [checks, setChecks] = useState<Record<string, boolean>>(
    Object.fromEntries([...essentialItems, exclusionItem].map(i => [i.id, false]))
  )
  const result = useMemo(() => {
    const essentialMet = essentialItems.every(i => checks[i.id])
    const exclusionDone = checks[exclusionItem.id]
    const allMet = essentialMet && exclusionDone
    const essentialCount = essentialItems.filter(i => checks[i.id]).length

    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (allMet) {
      interpretation = 'SIADH診断基準を満たす可能性あり（全必須項目+除外が確認済み）'
      severity = 'wn'
    } else if (essentialMet && !exclusionDone) {
      interpretation = '必須4項目は満たすが、除外診断が未完了'
      severity = 'wn'
    } else {
      interpretation = `SIADH診断基準を満たさない（必須項目 ${essentialCount}/4）— 全項目を満たす必要があります`
    }
    return { count: essentialCount + (exclusionDone ? 1 : 0), interpretation, severity }
  }, [checks])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="SIADH診断基準" value={result.count + '/5項目'}
        interpretation={result.interpretation} severity={result.severity}
        details={[{ label: '判定方法', value: '必須4項目すべて + 除外確認が必要（多数決ではない）' }]} />}
      references={[{ text: 'Bartter FC, Schwartz WB. Am J Med 1967;42:790-806' }, { text: 'Verbalis JG, et al. Am J Med 2007;120:S1-S21' }]}
    >
      <div className="space-y-2">
        <p className="text-xs font-bold text-ac">必須基準（すべて満たす必要あり）</p>
        {essentialItems.map(i => (
          <CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]}
            onChange={v => setChecks(p => ({ ...p, [i.id]: v }))} />
        ))}
        <p className="text-xs font-bold text-muted mt-3">除外診断</p>
        <CheckItem id={exclusionItem.id} label={exclusionItem.label} checked={checks[exclusionItem.id]}
          onChange={v => setChecks(p => ({ ...p, [exclusionItem.id]: v }))} />
      </div>
    </CalculatorLayout>
  )
}
