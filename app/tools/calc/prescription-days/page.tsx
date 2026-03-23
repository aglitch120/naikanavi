'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('prescription-days')!
export default function PrescriptionDaysPage() {
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState('')
  const [extra, setExtra] = useState('0')
  const result = useMemo(() => {
    if (!startDate || !endDate) return null
    const s = new Date(startDate), e = new Date(endDate)
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return null
    const ex = parseInt(extra) || 0
    const total = diff + ex
    return { diff, extra: ex, total }
  }, [startDate, endDate, extra])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity="ok" value={`処方日数 = ${result.total}日分`}
        interpretation={`次回外来まで ${result.diff}日${result.extra > 0 ? ` + 予備 ${result.extra}日` : ''}`} /> : null}
      explanation={<div className="text-sm text-muted"><p>今日の日付と次回外来日から処方日数を算出。予備日を加算可能。</p></div>}
      relatedTools={[]} references={toolDef.sources || []}
    >
      <div className="space-y-3">
        <div><label className="block text-sm font-bold text-tx mb-1">処方開始日</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2.5 bg-s0 border border-br rounded-xl text-sm text-tx" /></div>
        <div><label className="block text-sm font-bold text-tx mb-1">次回外来日</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2.5 bg-s0 border border-br rounded-xl text-sm text-tx" /></div>
        <div><label className="block text-sm font-bold text-tx mb-1">予備日数</label>
          <input type="number" value={extra} onChange={e => setExtra(e.target.value)} min="0" max="30" className="w-full px-3 py-2.5 bg-s0 border border-br rounded-xl text-sm text-tx" /></div>
      </div>
    </CalculatorLayout>
  )
}
