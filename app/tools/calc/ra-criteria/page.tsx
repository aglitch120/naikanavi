'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'

const JOINT_OPTIONS = [
  { label: '1つの大関節', value: 0 },
  { label: '2-10の大関節', value: 1 },
  { label: '1-3の小関節（大関節含まず）', value: 2 },
  { label: '4-10の小関節（大関節含まず）', value: 3 },
  { label: '>10関節（小関節1つ以上）', value: 5 },
]

const SEROLOGY_OPTIONS = [
  { label: 'RF陰性 かつ ACPA陰性', value: 0 },
  { label: 'RF低力価陽性 または ACPA低力価陽性（低力価: ULN超〜3×ULN以下）', value: 2 },
  { label: 'RF高力価陽性 または ACPA高力価陽性（高力価: 3×ULN超）', value: 3 },
]

const APR_OPTIONS = [
  { label: 'CRP正常 かつ ESR正常', value: 0 },
  { label: 'CRP異常 または ESR異常', value: 1 },
]

const DURATION_OPTIONS = [
  { label: '<6週間', value: 0 },
  { label: '>=6週間', value: 1 },
]

export default function RACriteriaPage() {
  const [joint, setJoint] = useState(0)
  const [serology, setSerology] = useState(0)
  const [apr, setApr] = useState(0)
  const [duration, setDuration] = useState(0)

  const result = useMemo(() => {
    const total = joint + serology + apr + duration
    const isRA = total >= 6
    return {
      score: total,
      isRA,
      label: isRA ? '関節リウマチ分類基準を満たす (>=6点)' : '基準を満たさない (<6点)',
      severity: (isRA ? 'dn' : 'ok') as 'ok' | 'wn' | 'dn',
    }
  }, [joint, serology, apr, duration])

  return (
    <CalculatorLayout
      slug="ra-criteria"
      title="関節リウマチ分類基準 2010 (ACR/EULAR)"
      titleEn="2010 ACR/EULAR RA Classification Criteria"
      description="2010年ACR/EULAR関節リウマチ分類基準。4ドメイン（関節病変・血清学・急性期反応物質・罹病期間）のスコアリング。6点以上でRAと分類。"
      category="general"
      categoryIcon="🦴"
      result={(
        <ResultCard
          label="ACR/EULAR 2010"
          value={`${result.score}/10`}
          severity={result.severity}
          details={[
            { label: '判定', value: result.label },
          ]}
        />
      )}
      references={[
        { text: 'Aletaha D, et al. 2010 Rheumatoid arthritis classification criteria. Arthritis Rheum 2010;62:2569-81', url: 'https://pubmed.ncbi.nlm.nih.gov/20872595/' },
      ]}
    >
      {/* A. 関節病変 */}
      <div className="mb-4">
        <p className="text-sm font-bold text-tx mb-2">A. 関節病変（0-5点）</p>
        <div className="space-y-1.5">
          {JOINT_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setJoint(o.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all ${joint === o.value ? 'bg-acl border-ac/30 text-ac font-bold' : 'border-br text-tx'}`}>
              {o.label} ({o.value}点)
            </button>
          ))}
        </div>
      </div>

      {/* B. 血清学 */}
      <div className="mb-4">
        <p className="text-sm font-bold text-tx mb-2">B. 血清学（0-3点）</p>
        <div className="space-y-1.5">
          {SEROLOGY_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setSerology(o.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all ${serology === o.value ? 'bg-acl border-ac/30 text-ac font-bold' : 'border-br text-tx'}`}>
              {o.label} ({o.value}点)
            </button>
          ))}
        </div>
      </div>

      {/* C. 急性期反応物質 */}
      <div className="mb-4">
        <p className="text-sm font-bold text-tx mb-2">C. 急性期反応物質（0-1点）</p>
        <div className="space-y-1.5">
          {APR_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setApr(o.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all ${apr === o.value ? 'bg-acl border-ac/30 text-ac font-bold' : 'border-br text-tx'}`}>
              {o.label} ({o.value}点)
            </button>
          ))}
        </div>
      </div>

      {/* D. 罹病期間 */}
      <div className="mb-4">
        <p className="text-sm font-bold text-tx mb-2">D. 罹病期間（0-1点）</p>
        <div className="space-y-1.5">
          {DURATION_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setDuration(o.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all ${duration === o.value ? 'bg-acl border-ac/30 text-ac font-bold' : 'border-br text-tx'}`}>
              {o.label} ({o.value}点)
            </button>
          ))}
        </div>
      </div>
    </CalculatorLayout>
  )
}
