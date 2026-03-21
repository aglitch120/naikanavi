'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('rcri')!

const criteria = [
  { id: 'highRiskSurgery', label: '高リスク手術', sublabel: '腹腔内・胸腔内・鼠径部より上の血管手術', points: 1 },
  { id: 'ihd', label: '虚血性心疾患の既往', sublabel: '心筋梗塞・狭心症・ST変化・PTCA/CABG後', points: 1 },
  { id: 'chf', label: 'うっ血性心不全の既往', sublabel: '心不全の既往・肺水腫・S3/頸静脈怒張', points: 1 },
  { id: 'cvd', label: '脳血管障害の既往', sublabel: '脳梗塞・TIAの既往', points: 1 },
  { id: 'insulin', label: 'インスリン使用中の糖尿病', sublabel: '術前にインスリンを使用', points: 1 },
  { id: 'renal', label: '腎機能障害', sublabel: '血清Cr > 2.0 mg/dL', points: 1 },
]

const riskData: Record<number, { risk: string; recommendation: string }> = {
  0: { risk: '3.9%', recommendation: '低リスク — 通常通り手術可能' },
  1: { risk: '6.0%', recommendation: '低〜中リスク — 機能的評価は不要なことが多い' },
  2: { risk: '10.1%', recommendation: '中リスク — 心機能評価を考慮' },
  3: { risk: '15%以上', recommendation: '高リスク — 心エコー・負荷検査を検討' },
}

function getSeverity(score: number): 'ok' | 'wn' | 'dn' {
  if (score <= 1) return 'ok'
  if (score === 2) return 'wn'
  return 'dn'
}

export default function RcriPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const result = useMemo(() => {
    const score = criteria.reduce((sum, c) => sum + (checked[c.id] ? c.points : 0), 0)
    const data = riskData[Math.min(score, 3)]
    return { score, ...data, severity: getSeverity(score) }
  }, [checked])

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
          label="RCRI スコア"
          value={result.score}
          unit="/ 6点"
          interpretation={result.recommendation}
          severity={result.severity}
          details={[
            { label: '主要心血管合併症リスク', value: result.risk },
          ]}
        />
      }
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">RCRI（Revised Cardiac Risk Index）とは</h2>
          <p>RCRIは非心臓手術における周術期の主要心血管合併症（心筋梗塞・肺水腫・心室細動/心停止・完全房室ブロック）のリスクを評価するスコアです。6項目の有無で0〜6点。</p>
          <h3 className="font-bold text-tx">スコア別リスク</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>0点: 3.9%</li>
            <li>1点: 6.0%</li>
            <li>2点: 10.1%</li>
            <li>≧3点: 15%以上</li>
          </ul>
        </section>
      }
      relatedTools={[]}
      references={[
        { text: 'Lee TH et al. Circulation 1999;100:1043-1049' },
        { text: '2014 ACC/AHA Guideline on Perioperative Cardiovascular Evaluation' },
      ]}
    >
      <div className="space-y-3">
        {criteria.map(c => (
          <CheckItem key={c.id} id={c.id} label={c.label} sublabel={c.sublabel} points={c.points} checked={!!checked[c.id]} onChange={v => setChecked(prev => ({ ...prev, [c.id]: v }))} />
        ))}
      </div>
    </CalculatorLayout>
  )
}
