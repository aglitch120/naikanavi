'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'

export default function DueDatePage() {
  const [lmp, setLmp] = useState('')
  const [today] = useState(() => new Date().toISOString().split('T')[0])

  const result = useMemo(() => {
    if (!lmp) return null
    const lmpDate = new Date(lmp + 'T00:00:00')
    const now = new Date(today + 'T00:00:00')

    // Naegele's rule: LMP + 280 days
    const edd = new Date(lmpDate.getTime() + 280 * 86400000)

    // Gestational age
    const diffMs = now.getTime() - lmpDate.getTime()
    const totalDays = Math.floor(diffMs / 86400000)
    const weeks = Math.floor(totalDays / 7)
    const days = totalDays % 7

    // Trimester
    let trimester = ''
    if (weeks < 0) trimester = '妊娠前'
    else if (weeks < 14) trimester = '第1三半期（初期）'
    else if (weeks < 28) trimester = '第2三半期（中期）'
    else if (weeks <= 42) trimester = '第3三半期（後期）'
    else trimester = '予定日超過'

    const remaining = Math.ceil((edd.getTime() - now.getTime()) / 86400000)

    return {
      edd: `${edd.getFullYear()}年${edd.getMonth() + 1}月${edd.getDate()}日`,
      weeks,
      days,
      totalDays,
      trimester,
      remaining,
      ga: `${weeks}週${days}日`,
    }
  }, [lmp, today])

  return (
    <CalculatorLayout
      slug="due-date"
      title="出産予定日・妊娠週数"
      titleEn="Estimated Due Date / Gestational Age"
      description="最終月経初日から出産予定日（Naegele式: LMP + 280日）と現在の妊娠週数を計算。"
      category="obstetrics"
      categoryIcon="🤰"
      result={result && (
        <ResultCard
          title="出産予定日"
          value={result.edd}
          severity="ok"
          items={[
            { label: '妊娠週数', value: result.ga },
            { label: '三半期', value: result.trimester },
            { label: '予定日まで', value: result.remaining > 0 ? `あと${result.remaining}日` : '予定日超過' },
          ]}
        />
      )}
      references={[
        { text: 'Naegele FR. Lehrbuch der Geburtshilfe, 1830' },
        { text: '日本産科婦人科学会 産婦人科診療ガイドライン 産科編 2020' },
      ]}
    >
      <label className="block text-sm font-medium text-tx mb-1">最終月経初日</label>
      <input
        type="date"
        value={lmp}
        onChange={e => setLmp(e.target.value)}
        className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-sm focus:border-ac outline-none"
      />
    </CalculatorLayout>
  )
}
