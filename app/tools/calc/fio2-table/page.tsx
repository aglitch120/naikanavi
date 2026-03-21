'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('fio2-table')!

const fio2Data: Record<string, { min: number; max: number; fio2: Record<number, number> }> = {
  nasal: { min: 1, max: 6, fio2: { 1: 0.24, 2: 0.28, 3: 0.32, 4: 0.36, 5: 0.40, 6: 0.44 } },
  mask: { min: 5, max: 8, fio2: { 5: 0.40, 6: 0.50, 7: 0.60, 8: 0.70 } },
  reservoir: { min: 6, max: 10, fio2: { 6: 0.60, 7: 0.70, 8: 0.80, 9: 0.90, 10: 0.95 } },
}

const deviceLabels: Record<string, string> = { nasal: '鼻カニューラ', mask: '簡易マスク', reservoir: 'リザーバー付マスク' }

export default function Fio2TablePage() {
  const [device, setDevice] = useState('nasal')
  const [flow, setFlow] = useState('2')

  const result = useMemo(() => {
    const d = fio2Data[device]
    const f = parseInt(flow) || 0
    const clamped = Math.max(d.min, Math.min(d.max, f))
    const fio2 = d.fio2[clamped]
    if (!fio2) return null
    return { fio2, fio2Pct: Math.round(fio2 * 100), device: deviceLabels[device], flow: clamped }
  }, [device, flow])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard label="推定FiO2" value={`${result.fio2Pct}%`} interpretation={`${result.device} ${result.flow} L/分`} severity="neutral"
          details={[{ label: 'FiO2（小数）', value: result.fio2.toFixed(2) }]} />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">FiO2換算表とは</h2>
          <p>酸素デバイスの種類と流量（L/分）から推定される吸入酸素濃度（FiO2）を換算します。A-aDO2の計算やP/F比の算出に必要です。</p>
          <div className="overflow-x-auto">
            <table className="text-xs w-full border-collapse">
              <thead><tr className="border-b border-br"><th className="text-left py-1 pr-2">L/分</th><th className="px-2">鼻カニューラ</th><th className="px-2">マスク</th><th className="px-2">リザーバー</th></tr></thead>
              <tbody>
                {[1,2,3,4,5,6,7,8,9,10].map(l => (<tr key={l} className="border-b border-br/50">
                  <td className="py-1 pr-2 font-mono">{l}</td>
                  <td className="px-2 font-mono">{fio2Data.nasal.fio2[l] ? (fio2Data.nasal.fio2[l] * 100).toFixed(0) + '%' : '—'}</td>
                  <td className="px-2 font-mono">{fio2Data.mask.fio2[l] ? (fio2Data.mask.fio2[l] * 100).toFixed(0) + '%' : '—'}</td>
                  <td className="px-2 font-mono">{fio2Data.reservoir.fio2[l] ? (fio2Data.reservoir.fio2[l] * 100).toFixed(0) + '%' : '—'}</td>
                </tr>))}
              </tbody>
            </table>
          </div>
          <h3 className="font-bold text-tx">注意点</h3>
          <p>FiO2は推定値であり、口呼吸・呼吸パターン・デバイスのフィットにより変動します。正確なFiO2が必要な場合はベンチュリーマスクを使用してください。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'American Association for Respiratory Care Clinical Practice Guideline' }]}
    >
      <div className="space-y-4">
        <RadioGroup label="酸素デバイス" name="device" value={device} onChange={setDevice}
          options={[{ value: 'nasal', label: '鼻カニューラ' }, { value: 'mask', label: '簡易マスク' }, { value: 'reservoir', label: 'リザーバー付' }]} />
        <NumberInput id="flow" label="酸素流量" unit="L/分" value={flow} onChange={setFlow} min={1} max={15} step={1} />
      </div>
    </CalculatorLayout>
  )
}
