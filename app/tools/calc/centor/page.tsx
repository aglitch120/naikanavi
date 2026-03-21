'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem, SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('centor')!

export default function CentorPage() {
  const [fever, setFever] = useState(false)
  const [cough, setCough] = useState(false)
  const [tonsillar, setTonsillar] = useState(false)
  const [lymph, setLymph] = useState(false)
  const [ageGroup, setAgeGroup] = useState('1')

  const result = useMemo(() => {
    let score = 0
    if (fever) score += 1
    if (!cough) score += 1
    if (tonsillar) score += 1
    if (lymph) score += 1
    score += parseInt(ageGroup)

    const gasProb = ['<10%', '<10%', '11-17%', '28-35%', '51-53%', '51-53%'][Math.max(0, Math.min(score, 5))]
    const severity: 'ok'|'wn'|'dn' = score <= 1 ? 'ok' : score <= 3 ? 'wn' : 'dn'
    let recommendation = ''
    if (score <= 0) recommendation = '検査・治療不要'
    else if (score <= 1) recommendation = '迅速抗原検査不要（GAS確率 <10%）'
    else if (score <= 3) recommendation = '迅速抗原検査を検討'
    else recommendation = '経験的抗菌薬投与 or 迅速検査'

    return { score: Math.max(score, 0), gasProb, severity, recommendation }
  }, [fever, cough, tonsillar, lymph, ageGroup])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Centor/McIsaac" value={result.score} unit="/ 5点" interpretation={result.recommendation} severity={result.severity}
        details={[{ label: 'GAS咽頭炎確率', value: result.gasProb }]} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">Centor スコア（McIsaac変法）とは</h2>
          <p>急性咽頭炎患者におけるA群溶血性連鎖球菌（GAS）感染の確率を評価するスコアです。McIsaac変法では年齢因子を追加し、小児〜成人まで対応します。不要な抗菌薬処方の削減に有用です。</p>
          <h3 className="font-bold text-tx">参考アクション</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>0-1点: 検査・抗菌薬不要</li>
            <li>2-3点: 迅速抗原検査を実施 → 陽性なら抗菌薬</li>
            <li>4-5点: 経験的抗菌薬投与を検討（または迅速検査後）</li>
          </ul>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Centor RM, et al. Med Decis Making 1981;1:239-246' }, { text: 'McIsaac WJ, et al. CMAJ 1998;158:75-83' }]}
    >
      <div className="space-y-3">
        <CheckItem id="fever" label="発熱 > 38°C" points={1} checked={fever} onChange={setFever} />
        <CheckItem id="cough" label="咳嗽なし" sublabel="咳がない = +1点" points={1} checked={!cough} onChange={v => setCough(!v)} />
        <CheckItem id="tonsillar" label="扁桃の腫脹または滲出物" points={1} checked={tonsillar} onChange={setTonsillar} />
        <CheckItem id="lymph" label="前頸部リンパ節の圧痛・腫脹" points={1} checked={lymph} onChange={setLymph} />
        <SelectInput id="ageGroup" label="年齢（McIsaac変法）" value={ageGroup} onChange={setAgeGroup}
          options={[
            { value: '1', label: '3-14歳 (+1)' },
            { value: '0', label: '15-44歳 (±0)' },
            { value: '-1', label: '≥45歳 (-1)' },
          ]} />
      </div>
    </CalculatorLayout>
  )
}
