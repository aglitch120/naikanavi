'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('stone-score')!

export default function STONEPage(){
  const [sex, setSex] = useState(false)
  const [timing, setTiming] = useState('0')
  const [origin, setOrigin] = useState(false)
  const [nausea, setNausea] = useState('0')
  const [erythrocyte, setErythrocyte] = useState(false)

  const result = useMemo(() => {
    const score = (sex ? 2 : 0) + Number(timing) + (origin ? 3 : 0) + Number(nausea) + (erythrocyte ? 3 : 0)
    if (score >= 9) return { score, severity: 'wn' as const, label: '高リスク（9-13）: 尿路結石の確率約90%（参考情報）' }
    if (score >= 6) return { score, severity: 'wn' as const, label: '中リスク（6-8）: 尿路結石の確率約50%（参考情報）' }
    return { score, severity: 'ok' as const, label: '低リスク（0-5）: 尿路結石の確率約10%' }
  }, [sex, timing, origin, nausea, erythrocyte])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="STONE" value={result.score} unit="/13点" interpretation={result.label} severity={result.severity} />}
      explanation={<div className="text-sm text-muted"><p>※「非黒人（+3点）」の項目を含む本スコアは日本人コホートでの検証は行われていない。結果は参考情報として扱うこと。</p></div>}
      relatedTools={[]} references={[{text:'Moore CL et al. Derivation and validation of a clinical prediction rule for uncomplicated ureteral stone. Acad Emerg Med 2014;21:1-10'}]}
    >
      <div className="space-y-3">
        <CheckItem id="sex" label="S: 男性 (+2点)" checked={sex} onChange={setSex} />
        <RadioGroup name="timing" label="T: 疼痛の持続時間" value={timing} onChange={setTiming} options={[
          { value: '0', label: '6時間未満 or 24時間超（0点）' },
          { value: '1', label: '6-24時間（発症→ER受診）（+1点）' },
          { value: '3', label: '6-24時間（発症→ER受診）かつ突然発症（+3点）' },
        ]} />
        <CheckItem id="origin" label="O: 非黒人 (+3点)" checked={origin} onChange={setOrigin} />
        <RadioGroup name="nausea" label="N: 悪心・嘔吐" value={nausea} onChange={setNausea} options={[
          { value: '0', label: 'なし（0点）' },
          { value: '1', label: '悪心のみ（+1点）' },
          { value: '2', label: '嘔吐あり（+2点）' },
        ]} />
        <CheckItem id="erythrocyte" label="E: 尿中赤血球 > 0 /HPF (+3点)" checked={erythrocyte} onChange={setErythrocyte} />
      </div>
    </CalculatorLayout>
  )
}
