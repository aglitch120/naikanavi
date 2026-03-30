'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup, CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('nrs2002')!

const nutrition = [
  { label: '栄養状態正常（0点）', value: '0' },
  { label: '3ヶ月で5%を超える体重減少、または過去1週間で通常の必要量の50〜75%に満たない食事摂取量（1点）', value: '1' },
  { label: '2ヶ月で5%を超える体重減少、またはBMI 18.5〜20.5および全身状態の悪化、もしくは過去1週間で通常の必要量の25〜60%の食事摂取量（2点）', value: '2' },
  { label: '1ヶ月で5%を超える体重減少（3ヶ月で15%超）、またはBMI 18.5未満かつ全身状態の悪化、または過去1週間で通常の必要量の0〜25%の食事摂取量（3点）', value: '3' },
]

const disease = [
  { label: '疾病または外傷なし（0点）', value: '0' },
  { label: '大腿骨頸部骨折、急性合併症のある慢性患者（例: 肝硬変、COPD、透析、糖尿病、腫瘍など）（1点）', value: '1' },
  { label: '腹部の大手術、脳卒中、重症肺炎、造血器腫瘍（2点）', value: '2' },
  { label: '頭部外傷、骨髄移植、ICU患者（APACHE >10点）（3点）', value: '3' },
]

export default function NRS2002Page() {
  const [showFinal, setShowFinal] = useState(false)
  const [n, setN] = useState('0')
  const [d, setD] = useState('0')
  const [age70, setAge70] = useState(false)

  const result = useMemo(() => {
    const score = Number(n) + Number(d) + (age70 ? 1 : 0)
    return {
      score,
      severity: score >= 3 ? 'wn' as const : 'ok' as const,
      label: score >= 3
        ? '栄養上のリスクあり（≧3点）— 栄養プランを開始する'
        : '栄養リスク低い（<3点）— 週1回の間隔でスクリーニングを繰り返す。大手術を受ける場合は予防的栄養ケアプランを考慮',
    }
  }, [n, d, age70])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={showFinal ? <ResultCard label="NRS 2002" value={result.score} unit="/7点" interpretation={result.label} severity={result.severity} /> : null}
      explanation={undefined}
      relatedTools={[{ slug: 'gnri', name: 'GNRI' }, { slug: 'conut', name: 'CONUT' }, { slug: 'pni', name: 'PNI' }]}
      references={[{ text: 'Kondrup J, et al. Nutritional risk screening (NRS 2002): a new method based on an analysis of controlled clinical trials. Clin Nutr 2003;22(4):415-21' }]}
    >
      <div className="space-y-5">
        {/* 初期スクリーニング */}
        <div className="bg-s0 border border-br rounded-xl p-4">
          <p className="text-sm font-bold text-tx mb-2">❶ 初期スクリーニング</p>
          <p className="text-xs text-muted mb-3">以下の質問の少なくとも1つがYesの場合、最終スクリーニングを行う。Noの場合は週1回間隔でスクリーニングを繰り返す。</p>
          <ul className="text-xs text-tx space-y-1.5 list-disc list-inside">
            <li>BMIが20.5未満か？</li>
            <li>過去3ヶ月以内に体重減少があったか？</li>
            <li>過去1週間で食事摂取量が減少したか？</li>
            <li>重度の病気にかかっているか？（例: 集中治療が必要）</li>
          </ul>
          {!showFinal && (
            <button onClick={() => setShowFinal(true)} className="mt-3 px-4 py-2 bg-ac text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all">
              1つ以上Yes → 最終スクリーニングへ
            </button>
          )}
        </div>

        {/* 最終スクリーニング */}
        {showFinal && <div className="space-y-4">
          <p className="text-sm font-bold text-tx">❷ 最終スクリーニング</p>
          <p className="text-xs text-muted">下記3項目のスコアの合計点で評価する</p>

          <p className="text-xs font-bold text-ac">(1) 栄養の重症度</p>
          <RadioGroup id="n" label="" options={nutrition} value={n} onChange={setN} />

          <p className="text-xs font-bold text-ac">(2) 疾病または外傷の重症度</p>
          <RadioGroup id="d" label="" options={disease} value={d} onChange={setD} />

          <p className="text-xs font-bold text-ac">(3) 年齢</p>
          <CheckItem id="age70" label="≧70歳（+1点）" checked={age70} onChange={setAge70} />
        </div>}
      </div>
    </CalculatorLayout>
  )
}
