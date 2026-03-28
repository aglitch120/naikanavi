'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'

export default function PFRatioPage() {
  const [pao2, setPao2] = useState('80')
  const [fio2, setFio2] = useState('0.21')

  const result = useMemo(() => {
    const p = parseFloat(pao2)
    const f = parseFloat(fio2)
    if (!p || !f || f <= 0) return null

    const ratio = p / f
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    let label = ''

    if (ratio >= 400) { label = '正常'; severity = 'ok' }
    else if (ratio >= 300) { label = '酸素化軽度低下（Berlin ARDS基準外）'; severity = 'wn' }
    else if (ratio > 200) { label = 'Berlin定義 軽症 Mild ARDS (P/F 201-300, PEEP≧5)'; severity = 'wn' }
    else if (ratio > 100) { label = 'Berlin定義 中等症 Moderate ARDS (P/F 101-200, PEEP≧5)'; severity = 'dn' }
    else { label = 'Berlin定義 重症域 (P/F <100)'; severity = 'dn' }

    return { ratio: Math.round(ratio), label, severity }
  }, [pao2, fio2])

  return (
    <CalculatorLayout
      slug="pf-ratio"
      title="P/F比（PaO2/FiO2比）"
      titleEn="P/F Ratio"
      description="PaO2をFiO2で割った酸素化の指標。ARDSの重症度分類（Berlin定義: PEEP ≧5 cmH₂O下で評価）に使用。"
      category="respiratory"
      categoryIcon="🫁"
      result={result && (
        <div className="space-y-3">
          <ResultCard
            label="P/F比"
            value={`${result.ratio}`}
            unit="mmHg"
            severity={result.severity}
            details={[
              { label: '判定', value: result.label },
              { label: 'Berlin定義', value: result.ratio >= 300 ? '該当なし' : result.ratio > 200 ? 'Mild ARDS (201-300)' : result.ratio > 100 ? 'Moderate ARDS (101-200)' : 'Severe ARDS (≦100)' },
            ]}
          />
          {result.ratio < 300 && (
            <div className="bg-wnl border border-wnb rounded-xl p-3">
              <p className="text-xs font-medium text-wn">Berlin定義の適用条件</p>
              <p className="text-xs text-wn mt-1">※ Berlin定義ではPEEP ≧5 cmH₂O下での評価が必要。PEEP条件未確認の場合はARDS診断不確定</p>
            </div>
          )}
        </div>
      )}
      references={[
        { text: 'ARDS Definition Task Force. JAMA 2012;307:2526-33', url: 'https://pubmed.ncbi.nlm.nih.gov/22797452/' },
      ]}
    >
      <NumberInput label="PaO2" value={pao2} onChange={setPao2} unit="mmHg" step={1} min={0} max={600} />
      <NumberInput label="FiO2" value={fio2} onChange={setFio2} unit="" step={0.01} min={0.21} max={1.0} />
      <p className="text-[10px] text-muted mt-1">FiO2は0.21（室内気）〜1.0（100%酸素）で入力</p>
    </CalculatorLayout>
  )
}
