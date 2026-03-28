'use client'

import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'

const GRADES = [
  {
    grade: 'I度（軽症）',
    symptoms: ['めまい・立ちくらみ', '筋肉痛・こむら返り', '大量発汗', '意識障害なし'],
    action: '涼しい場所へ移動, 経口補水液で水分・塩分補給, 安静',
    severity: 'wn' as const,
  },
  {
    grade: 'II度（中等症）',
    symptoms: ['頭痛・嘔気・嘔吐', '倦怠感・脱力感', '集中力低下'],
    action: '症状への対応は担当医が判断',
    severity: 'wn' as const,
  },
  {
    grade: 'III度（重症）',
    symptoms: ['意識障害（JCS II群以上 or GCS≦14）', '痙攣', '深部体温>40度', '肝・腎機能障害', 'DIC'],
    action: '対応は担当医が判断',
    severity: 'dn' as const,
  },
]

export default function HeatStrokePage() {
  const [selected, setSelected] = useState<number | null>(null)

  const result = selected !== null ? GRADES[selected] : null

  return (
    <CalculatorLayout
      slug="heat-stroke"
      title="熱中症 重症度分類"
      titleEn="Heat Stroke Severity Classification"
      description="日本救急医学会の熱中症重症度分類（I度〜III度）。症状から重症度を判定。"
      category="emergency"
      categoryIcon="🌡️"
      result={result && (
        <ResultCard
          label="重症度"
          value={result.grade}
          severity={result.severity}
          details={[
            { label: '対応', value: result.action },
          ]}
        />
      )}
      references={[
        { text: '日本救急医学会 熱中症診療ガイドライン 2015', url: 'https://www.jaam.jp/info/2015/pdf/info-20150413.pdf' },
        { text: '※2024年改訂版が公表されています。最新の分類・対応については日本救急医学会の公式サイトでご確認ください。' },
      ]}
    >
      <p className="text-sm font-medium text-tx mb-3">該当する症状を含む最も重い分類を選択</p>
      <div className="space-y-3">
        {GRADES.map((g, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selected === i ? 'border-ac bg-acl' : 'border-br bg-s0 hover:border-ac/30'
            }`}>
            <p className="text-sm font-bold text-tx mb-1">{g.grade}</p>
            <ul className="space-y-0.5">
              {g.symptoms.map(s => (
                <li key={s} className="text-xs text-muted flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-muted flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </CalculatorLayout>
  )
}
