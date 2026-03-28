'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'

export default function DAS28Page() {
  const [tender, setTender] = useState('4')
  const [swollen, setSwollen] = useState('2')
  const [esr, setEsr] = useState('30')
  const [vas, setVas] = useState('50')
  const [useCRP, setUseCRP] = useState(false)
  const [crp, setCrp] = useState('1.5')

  const result = useMemo(() => {
    const t = parseFloat(tender)
    const s = parseFloat(swollen)
    const marker = useCRP ? parseFloat(crp) : parseFloat(esr)
    const v = parseFloat(vas)
    if (isNaN(t) || isNaN(s) || isNaN(marker) || isNaN(v)) return null

    let score: number
    if (useCRP) {
      // DAS28-CRP: 原著式はCRP mg/L単位。日本はmg/dL入力のため×10でmg/Lに変換
      const crpMgL = marker * 10
      score = 0.56 * Math.sqrt(t) + 0.28 * Math.sqrt(s) + 0.36 * Math.log(crpMgL + 1) + 0.014 * v + 0.96
    } else {
      // DAS28-ESR = 0.56*sqrt(TJC28) + 0.28*sqrt(SJC28) + 0.70*ln(ESR) + 0.014*VAS
      score = 0.56 * Math.sqrt(t) + 0.28 * Math.sqrt(s) + 0.70 * Math.log(Math.max(marker, 1)) + 0.014 * v
    }

    const rounded = Math.round(score * 100) / 100
    let category = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'

    if (rounded <= 2.6) { category = '寛解'; severity = 'ok' }
    else if (rounded <= 3.2) { category = '低疾患活動性'; severity = 'ok' }
    else if (rounded <= 5.1) { category = '中等度疾患活動性'; severity = 'wn' }
    else { category = '高疾患活動性'; severity = 'dn' }

    return { score: rounded, category, severity, type: useCRP ? 'DAS28-CRP' : 'DAS28-ESR' }
  }, [tender, swollen, esr, crp, vas, useCRP])

  return (
    <CalculatorLayout
      slug="das28"
      title="DAS28（疾患活動性スコア）"
      titleEn="Disease Activity Score 28"
      description="関節リウマチの疾患活動性を28関節の圧痛・腫脹+ESR/CRP+患者VASで評価。EULAR分類基準。"
      category="general"
      categoryIcon="🦴"
      result={result && (
        <div className="space-y-2">
          <ResultCard
            label={result.type}
            value={`${result.score}`}
            severity={result.severity}
            details={[
              { label: '疾患活動性', value: result.category },
              { label: '判定基準', value: '<=2.6 寛解 / <=3.2 低 / <=5.1 中 / >5.1 高' },
            ]}
          />
          <p className="text-[10px] text-muted px-1">DAS28-CRP ≤2.6は寛解の一指標。SDAI/CDAI寛解基準とは一致しないことがある</p>
        </div>
      )}
      references={[
        { text: 'Prevoo ML, et al. Modified disease activity scores that include twenty-eight-joint counts. Arthritis Rheum 1995;38:44-8', url: 'https://pubmed.ncbi.nlm.nih.gov/7818570/' },
      ]}
    >
      <div className="flex gap-2 mb-3">
        {['ESR', 'CRP'].map(m => (
          <button key={m} onClick={() => setUseCRP(m === 'CRP')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
              (m === 'CRP') === useCRP ? 'bg-acl border-ac/30 text-ac' : 'border-br text-muted'
            }`}>
            DAS28-{m}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberInput label="圧痛関節数 (TJC28)" value={tender} onChange={setTender} unit="関節" min={0} max={28} />
        <NumberInput label="腫脹関節数 (SJC28)" value={swollen} onChange={setSwollen} unit="関節" min={0} max={28} />
      </div>
      {useCRP ? (
        <NumberInput label="CRP" value={crp} onChange={setCrp} unit="mg/dL" step={0.1} hint="mg/dL（日本標準）で入力。mg/L表示の施設は10で割って入力" />
      ) : (
        <NumberInput label="ESR" value={esr} onChange={setEsr} unit="mm/h" />
      )}
      <NumberInput label="患者VAS" value={vas} onChange={setVas} unit="mm (0-100)" min={0} max={100} />
    </CalculatorLayout>
  )
}
