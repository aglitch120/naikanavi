'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('pancreatitis-prognostic')!

const mainItems = [
  'BE ≦ -3 mEq/L or ショック(sBP≦80)',
  'PaO₂ ≦ 60 mmHg (room air) or 呼吸不全(人工呼吸管理)',
  'BUN ≧ 40 mg/dL (or Cr ≧ 2.0) or 乏尿(日尿量≦400mL/日)',
  'LDH ≧ 基準上限の2倍',
  'Plt ≦ 10万/μL',
  'Ca ≦ 7.5 mg/dL',
  'CRP ≧ 15 mg/dL',
]

const sirsItems = [
  '体温 >38℃ or <36℃',
  '心拍数 >90/min',
  '呼吸数 >20/min or PaCO₂ <32mmHg',
  'WBC >12,000 or <4,000 or 桿状核球 >10%',
]

export default function PancreatitisPrognosticPage() {
  const [checked, setChecked] = useState<boolean[]>(mainItems.map(() => false))
  const [sirsChecked, setSirsChecked] = useState<boolean[]>(sirsItems.map(() => false))
  const [ageChecked, setAgeChecked] = useState(false)

  const sirsCount = sirsChecked.filter(Boolean).length
  const sirsMet = sirsCount >= 3

  const result = useMemo(() => {
    const total = checked.filter(Boolean).length + (sirsMet ? 1 : 0) + (ageChecked ? 1 : 0)
    let severity: 'ok' | 'wn' | 'dn' = 'ok', interpretation = ''
    if (total >= 3) { interpretation = `${total}/9項目 — 重症。ICU管理・専門施設への搬送を検討`; severity = 'dn' }
    else if (total >= 2) { interpretation = `${total}/9項目 — 中等症の可能性。48時間以内の再評価が必要`; severity = 'wn' }
    else { interpretation = `${total}/9項目 — 軽症の可能性が高い` }
    return { total, severity, interpretation }
  }, [checked, sirsMet, ageChecked])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={`予後因子 ${result.total}/9`} interpretation={result.interpretation} />}
      explanation={<div className="text-sm text-muted"><p>≧3項目で重症。予後因子と造影CTグレード(Balthazar)を合わせてseverity indexを算出。入院48時間以内に評価。</p></div>}
      relatedTools={[{ slug: 'pancreatitis-ct', name: '膵炎CTグレード' }, { slug: 'ranson', name: 'Ranson' }, { slug: 'bisap', name: 'BISAP' }]}
      references={toolDef.sources || []}
    >
      <div className="space-y-2">
        {/* 1-7: メイン項目 */}
        {mainItems.map((item, i) => (
          <label key={i} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${checked[i] ? 'bg-wnl border border-wnb' : 'bg-s0 border border-br'}`}>
            <input type="checkbox" checked={checked[i]} onChange={() => { const n = [...checked]; n[i] = !n[i]; setChecked(n) }} className="accent-[var(--ac)]" />
            <span className="text-sm text-tx">{item}</span>
          </label>
        ))}

        {/* 8: SIRS — サブ項目展開 */}
        <div className={`rounded-lg border transition-all ${sirsMet ? 'bg-wnl border-wnb' : 'bg-s0 border-br'}`}>
          <div className="flex items-center gap-3 p-3">
            <input type="checkbox" checked={sirsMet} readOnly className="accent-[var(--ac)] pointer-events-none" />
            <span className={`text-sm font-medium ${sirsMet ? 'text-wn' : 'text-tx'}`}>
              SIRS基準 3項目以上（{sirsCount}/4）
            </span>
          </div>
          <div className="px-3 pb-3 space-y-1.5">
            {sirsItems.map((item, i) => (
              <label key={i} className={`flex items-center gap-2.5 p-2 rounded-md cursor-pointer transition-all ${sirsChecked[i] ? 'bg-ac/10 border border-ac/30' : 'bg-s1 border border-transparent'}`}>
                <input type="checkbox" checked={sirsChecked[i]} onChange={() => { const n = [...sirsChecked]; n[i] = !n[i]; setSirsChecked(n) }} className="accent-[var(--ac)]" />
                <span className="text-xs text-tx">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 9: 年齢 */}
        <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${ageChecked ? 'bg-wnl border border-wnb' : 'bg-s0 border border-br'}`}>
          <input type="checkbox" checked={ageChecked} onChange={() => setAgeChecked(!ageChecked)} className="accent-[var(--ac)]" />
          <span className="text-sm text-tx">年齢 ≧ 70歳</span>
        </label>
      </div>
    </CalculatorLayout>
  )
}
