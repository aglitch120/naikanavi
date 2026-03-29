'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'

export default function ASCVDPage() {
  const [age, setAge] = useState('55')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [totalChol, setTotalChol] = useState('220')
  const [hdl, setHdl] = useState('50')
  const [sbp, setSbp] = useState('140')
  const [bpTreat, setBpTreat] = useState(false)
  const [diabetes, setDiabetes] = useState(false)
  const [smoker, setSmoker] = useState(false)

  const result = useMemo(() => {
    const a = parseFloat(age)
    const tc = parseFloat(totalChol)
    const h = parseFloat(hdl)
    const s = parseFloat(sbp)
    if (!a || !tc || !h || !s || a < 40 || a > 79) return null

    // Pooled Cohort Equations (2013 ACC/AHA)
    // Simplified 10-year ASCVD risk calculation
    const lnAge = Math.log(a)
    const lnTC = Math.log(tc)
    const lnHDL = Math.log(h)
    const lnSBP = Math.log(s)

    let sum: number
    let baseline: number
    let mean: number

    if (sex === 'male') {
      sum = 12.344 * lnAge + 11.853 * lnTC - 2.664 * lnAge * lnTC
        - 7.990 * lnHDL + 1.769 * lnAge * lnHDL
        + (bpTreat ? 1.797 * lnSBP : 1.764 * lnSBP)
        + (smoker ? 7.837 - 1.795 * lnAge : 0)
        + (diabetes ? 0.658 : 0)
      baseline = 0.9144
      mean = 61.18
    } else {
      sum = -29.799 * lnAge + 4.884 * lnAge * lnAge + 13.540 * lnTC - 3.114 * lnAge * lnTC
        - 13.578 * lnHDL + 3.149 * lnAge * lnHDL
        + (bpTreat ? 2.019 * lnSBP : 1.957 * lnSBP)
        + (smoker ? 7.574 - 1.665 * lnAge : 0)
        + (diabetes ? 0.661 : 0)
      baseline = 0.9665
      mean = -29.18
    }

    const risk = (1 - Math.pow(baseline, Math.exp(sum - mean))) * 100
    const clamped = Math.max(0, Math.min(99, risk))
    const rounded = Math.round(clamped * 10) / 10

    let category = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (rounded < 5) { category = '低リスク'; severity = 'ok' }
    else if (rounded < 7.5) { category = 'ボーダーライン'; severity = 'wn' }
    else if (rounded < 20) { category = '中リスク'; severity = 'wn' }
    else { category = '高リスク'; severity = 'dn' }

    return { risk: rounded, category, severity }
  }, [age, sex, totalChol, hdl, sbp, bpTreat, diabetes, smoker])

  return (
    <CalculatorLayout
      slug="ascvd"
      title="10年ASCVDリスク"
      titleEn="10-Year ASCVD Risk (Pooled Cohort Equations)"
      description="Pooled Cohort Equations (2013 ACC/AHA) による10年間の動脈硬化性心血管疾患リスクを推算。40-79歳が対象。"
      category="cardiology"
      categoryIcon="❤️"
      result={result && (
        <ResultCard
          label="10年ASCVDリスク"
          value={`${result.risk}%`}
          severity={result.severity}
          details={[
            { label: 'リスクカテゴリ', value: result.category },
            { label: '判定基準', value: '<5%: 低 / 5-7.5%: ボーダーライン / 7.5-20%: 中 / >=20%: 高' },
            { label: '注意', value: 'PCE（Pooled Cohort Equations）は主に欧米コホートで開発。日本人では過大評価の可能性がある。日本人向けには吹田スコア・久山町スコアが存在する' },
          ]}
        />
      )}
      references={[
        { text: 'Goff DC Jr, et al. 2013 ACC/AHA Guideline on the Assessment of Cardiovascular Risk. Circulation 2014;129:S49-S73', url: 'https://pubmed.ncbi.nlm.nih.gov/24222018/' },
      ]}
    >
      <div className="grid grid-cols-2 gap-3">
        <NumberInput label="年齢" value={age} onChange={setAge} unit="歳" min={40} max={79} />
        <div>
          <label className="block text-sm font-medium text-tx mb-1">性別</label>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map(s => (
              <button key={s} onClick={() => setSex(s)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${sex === s ? 'bg-acl border-ac/30 text-ac' : 'border-br text-muted'}`}>
                {s === 'male' ? '男性' : '女性'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberInput label="総コレステロール" value={totalChol} onChange={setTotalChol} unit="mg/dL" />
        <NumberInput label="HDL-C" value={hdl} onChange={setHdl} unit="mg/dL" />
      </div>
      <NumberInput label="収縮期血圧" value={sbp} onChange={setSbp} unit="mmHg" />
      <div className="space-y-2">
        {[
          { label: '降圧薬服用中', checked: bpTreat, onChange: setBpTreat },
          { label: '糖尿病あり', checked: diabetes, onChange: setDiabetes },
          { label: '現在喫煙', checked: smoker, onChange: setSmoker },
        ].map(c => (
          <label key={c.label} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={c.checked} onChange={e => c.onChange(e.target.checked)}
              className="rounded border-br" />
            <span className="text-tx">{c.label}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-wn">※PCEは日本人で過大評価の可能性。日本人向けには吹田スコア・久山町スコアが存在する</p>
    </CalculatorLayout>
  )
}
