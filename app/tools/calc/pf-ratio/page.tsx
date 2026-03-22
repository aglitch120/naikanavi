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
    else if (ratio >= 300) { label = '軽度低下'; severity = 'wn' }
    else if (ratio >= 200) { label = 'ARDS軽症 (Mild ARDS)'; severity = 'wn' }
    else if (ratio >= 100) { label = 'ARDS中等症 (Moderate ARDS)'; severity = 'dn' }
    else { label = 'ARDS重症 (Severe ARDS)'; severity = 'dn' }

    return { ratio: Math.round(ratio), label, severity }
  }, [pao2, fio2])

  return (
    <CalculatorLayout
      slug="pf-ratio"
      title="P/F比（PaO2/FiO2比）"
      titleEn="P/F Ratio"
      description="PaO2をFiO2で割った酸素化の指標。ARDSの重症度分類（Berlin定義）に使用。"
      category="respiratory"
      categoryIcon="🫁"
      result={result && (
        <ResultCard
          title="P/F比"
          value={`${result.ratio}`}
          unit="mmHg"
          severity={result.severity}
          items={[
            { label: '判定', value: result.label },
            { label: 'Berlin定義', value: result.ratio >= 300 ? '該当なし' : result.ratio >= 200 ? 'Mild ARDS (200-300)' : result.ratio >= 100 ? 'Moderate ARDS (100-200)' : 'Severe ARDS (<100)' },
          ]}
        />
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
