'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'

// Framingham Risk Score point tables
const MALE_AGE_POINTS: [number, number, number][] = [[20,34,-9],[35,39,-4],[40,44,0],[45,49,3],[50,54,6],[55,59,8],[60,64,10],[65,69,11],[70,74,12],[75,79,13]]
const FEMALE_AGE_POINTS: [number, number, number][] = [[20,34,-7],[35,39,-3],[40,44,0],[45,49,3],[50,54,6],[55,59,8],[60,64,10],[65,69,12],[70,74,14],[75,79,16]]

function getAgePoints(age: number, sex: 'male' | 'female') {
  const table = sex === 'male' ? MALE_AGE_POINTS : FEMALE_AGE_POINTS
  for (const [min, max, pts] of table) { if (age >= min && age <= max) return pts }
  return 0
}

// TC points: keys are lower bounds of each TC range, values are [20-39, 40-49, 50-59, 60-69, 70-79]
const MALE_TC_POINTS: [number, number[]][] = [[160,[0,0,0,0,0]],[200,[4,3,2,1,0]],[240,[7,5,3,1,0]],[280,[9,6,4,2,1]],[999,[11,8,5,3,1]]]
const FEMALE_TC_POINTS: [number, number[]][] = [[160,[0,0,0,0,0]],[200,[4,3,2,1,1]],[240,[8,6,4,2,1]],[280,[11,8,5,3,2]],[999,[13,10,7,4,2]]]

// Smoking points by age group index [20-39, 40-49, 50-59, 60-69, 70-79] (Wilson 1998)
const MALE_SMOKE_POINTS = [8, 5, 3, 1, 1]
const FEMALE_SMOKE_POINTS = [9, 7, 4, 2, 1]

function getAgeGroupIndex(age: number): number {
  if (age <= 39) return 0
  if (age <= 49) return 1
  if (age <= 59) return 2
  if (age <= 69) return 3
  return 4
}

function getTcPoints(tc: number, ageGroupIdx: number, sex: 'male' | 'female'): number {
  const table = sex === 'male' ? MALE_TC_POINTS : FEMALE_TC_POINTS
  let pts = 0
  for (const [threshold, pointsByAge] of table) {
    if (tc >= threshold) pts = pointsByAge[ageGroupIdx]
  }
  return pts
}

export default function FraminghamPage() {
  const [age, setAge] = useState('55')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [totalChol, setTotalChol] = useState('220')
  const [hdl, setHdl] = useState('50')
  const [sbp, setSbp] = useState('140')
  const [bpTreat, setBpTreat] = useState(false)
  const [smoker, setSmoker] = useState(false)

  const result = useMemo(() => {
    const a = parseInt(age)
    const tc = parseFloat(totalChol)
    const h = parseFloat(hdl)
    const s = parseFloat(sbp)
    if (!a || !tc || !h || !s || a < 20 || a > 79) return null

    const ageGroupIdx = getAgeGroupIndex(a)
    let points = getAgePoints(a, sex)

    // HDL points
    if (h >= 60) points += (sex === 'male' ? -1 : -1)
    else if (h >= 50) points += 0
    else if (h >= 40) points += 1
    else points += 2

    // SBP points (simplified)
    if (bpTreat) {
      if (s >= 160) points += (sex === 'male' ? 3 : 6)
      else if (s >= 140) points += (sex === 'male' ? 2 : 5)
      else if (s >= 130) points += (sex === 'male' ? 2 : 4)
      else if (s >= 120) points += (sex === 'male' ? 1 : 3)
      else points += 0
    } else {
      if (s >= 160) points += (sex === 'male' ? 2 : 4)
      else if (s >= 140) points += (sex === 'male' ? 1 : 3)
      else if (s >= 130) points += (sex === 'male' ? 1 : 2)
      else if (s >= 120) points += 0
      else points += 0
    }

    // Smoking — Wilson 1998 age-stratified points
    if (smoker) points += (sex === 'male' ? MALE_SMOKE_POINTS[ageGroupIdx] : FEMALE_SMOKE_POINTS[ageGroupIdx])

    // TC (age-stratified, Wilson 1998 Table 2)
    points += getTcPoints(tc, ageGroupIdx, sex)

    // Risk lookup (simplified)
    let risk = 0
    if (sex === 'male') {
      if (points <= 0) risk = 1
      else if (points <= 4) risk = 1
      else if (points <= 6) risk = 2
      else if (points <= 7) risk = 3
      else if (points <= 8) risk = 4
      else if (points <= 9) risk = 5
      else if (points <= 10) risk = 6
      else if (points <= 11) risk = 8
      else if (points <= 12) risk = 10
      else if (points <= 13) risk = 12
      else if (points <= 14) risk = 16
      else if (points <= 15) risk = 20
      else if (points <= 16) risk = 25
      else risk = 30
    } else {
      if (points <= 8) risk = 1
      else if (points <= 12) risk = 1
      else if (points <= 14) risk = 2
      else if (points <= 15) risk = 3
      else if (points <= 16) risk = 4
      else if (points <= 17) risk = 5
      else if (points <= 18) risk = 6
      else if (points <= 19) risk = 8
      else if (points <= 20) risk = 11
      else if (points <= 21) risk = 14
      else if (points <= 22) risk = 17
      else if (points <= 23) risk = 22
      else if (points <= 24) risk = 27
      else risk = 30
    }

    let category = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (risk < 10) { category = '低リスク (<10%)'; severity = 'ok' }
    else if (risk < 20) { category = '中リスク (10-19%)'; severity = 'wn' }
    else { category = '高リスク (>=20%)'; severity = 'dn' }

    return { risk, points, category, severity }
  }, [age, sex, totalChol, hdl, sbp, bpTreat, smoker])

  return (
    <CalculatorLayout
      slug="framingham"
      title="フラミンガムリスクスコア"
      titleEn="Framingham Risk Score"
      description="10年間の冠動脈疾患（CHD）リスクを推算。年齢・性別・TC・HDL・血圧・喫煙から算出。※日本人には久山町スコア/吹田スコアがより適切（PCEは過大評価の可能性）。"
      category="cardiology"
      categoryIcon="❤️"
      result={result && (
        <ResultCard
          label="10年CHDリスク"
          value={`${result.risk}%`}
          severity={result.severity}
          details={[
            { label: 'ポイント', value: `${result.points}点` },
            { label: 'リスクカテゴリ', value: result.category },
            { label: '注意', value: 'Framinghamスコアは欧米コホートで開発。日本人では1.5-2倍の過大評価が報告されており、吹田スコア・久山町スコアの使用を推奨' },
          ]}
        />
      )}
      references={[
        { text: 'Wilson PW, et al. Prediction of coronary heart disease using risk factor categories. Circulation 1998;97:1837-47', url: 'https://pubmed.ncbi.nlm.nih.gov/9603539/' },
      ]}
    >
      <div className="grid grid-cols-2 gap-3">
        <NumberInput label="年齢" value={age} onChange={setAge} unit="歳" min={20} max={79} />
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
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={bpTreat} onChange={e => setBpTreat(e.target.checked)} className="rounded border-br" />
          <span className="text-tx">降圧薬服用中</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={smoker} onChange={e => setSmoker(e.target.checked)} className="rounded border-br" />
          <span className="text-tx">現在喫煙</span>
        </label>
      </div>
    </CalculatorLayout>
  )
}
