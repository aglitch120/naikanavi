'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'

const GFR_STAGES = [
  { stage: 'G1', label: '正常または高値', min: 90, color: '#166534' },
  { stage: 'G2', label: '正常または軽度低下', min: 60, color: '#15803d' },
  { stage: 'G3a', label: '軽度〜中等度低下', min: 45, color: '#92400E' },
  { stage: 'G3b', label: '中等度〜高度低下', min: 30, color: '#B45309' },
  { stage: 'G4', label: '高度低下', min: 15, color: '#991B1B' },
  { stage: 'G5', label: '末期腎不全 (ESKD)', min: 0, color: '#7f1d1d' },
]

const ALBUMIN_STAGES = [
  { stage: 'A1', label: '正常', max: 30, color: '#166534' },
  { stage: 'A2', label: '微量アルブミン尿', max: 300, color: '#92400E' },
  { stage: 'A3', label: '顕性アルブミン尿', max: Infinity, color: '#991B1B' },
]

export default function CKDStagePage() {
  const [gfr, setGfr] = useState('55')
  const [albumin, setAlbumin] = useState('20')

  const result = useMemo(() => {
    const g = parseFloat(gfr)
    const a = parseFloat(albumin)
    if (isNaN(g)) return null

    const gStage = GFR_STAGES.find(s => g >= s.min) || GFR_STAGES[GFR_STAGES.length - 1]
    const aStage = !isNaN(a)
      ? ALBUMIN_STAGES.find(s => a < s.max) || ALBUMIN_STAGES[ALBUMIN_STAGES.length - 1]
      : null

    // CGA分類のリスク判定
    let riskLevel = 'low'
    const gIdx = GFR_STAGES.indexOf(gStage)
    const aIdx = aStage ? ALBUMIN_STAGES.indexOf(aStage) : 0
    // KDIGO 2012 リスクマトリクス準拠
    if (gIdx >= 4 || (gIdx >= 3 && aIdx >= 1) || (gIdx >= 2 && aIdx >= 2)) riskLevel = 'very-high'
    else if (gIdx >= 3 || (gIdx >= 2 && aIdx >= 1) || (gIdx >= 1 && aIdx >= 2)) riskLevel = 'high'
    else if (gIdx >= 2 || aIdx >= 1) riskLevel = 'moderate'

    const severity: 'ok' | 'wn' | 'dn' = riskLevel === 'low' ? 'ok' : riskLevel === 'moderate' ? 'wn' : 'dn'
    const riskLabels: Record<string, string> = { low: '低リスク（緑）', moderate: '中リスク（黄）', high: '高リスク（橙）', 'very-high': '最高リスク（赤）' }

    return {
      gStage: gStage.stage,
      gLabel: gStage.label,
      gColor: gStage.color,
      aStage: aStage?.stage || '--',
      aLabel: aStage?.label || '--',
      cga: `${gStage.stage}${aStage ? aStage.stage : ''}`,
      riskLevel: riskLabels[riskLevel],
      severity,
    }
  }, [gfr, albumin])

  return (
    <CalculatorLayout
      slug="ckd-stage"
      title="CKDステージ分類（CGA分類）"
      titleEn="CKD Stage Classification (CGA)"
      description="eGFRとアルブミン尿からCKDのGFR区分(G1-G5)・アルブミン尿区分(A1-A3)・CGA分類によるリスク判定を行う。"
      category="nephrology"
      categoryIcon="💧"
      result={result && (
        <ResultCard
          label="CKDステージ"
          value={result.cga}
          severity={result.severity}
          details={[
            { label: 'GFR区分', value: `${result.gStage}（${result.gLabel}）` },
            { label: 'アルブミン尿区分', value: `${result.aStage}（${result.aLabel}）` },
            { label: 'CGA分類リスク', value: result.riskLevel },
          ]}
        />
      )}
      references={[
        { text: 'KDIGO 2012 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int Suppl 2013;3:1-150', url: 'https://pubmed.ncbi.nlm.nih.gov/25018975/' },
        { text: 'CKD診療ガイドライン 2023. 日本腎臓学会' },
      ]}
    >
      <NumberInput label="eGFR" value={gfr} onChange={setGfr} unit="mL/min/1.73m2" step={1} />
      <NumberInput label="尿中アルブミン" value={albumin} onChange={setAlbumin} unit="mg/gCr" step={1} />
      <p className="text-[10px] text-muted">eGFRはeGFR計算ツールで算出可能。アルブミン尿が不明な場合は空欄で可。</p>
    </CalculatorLayout>
  )
}
