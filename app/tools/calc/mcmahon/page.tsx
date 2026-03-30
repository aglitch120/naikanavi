'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('mcmahon')!

export default function McMahonPage(){
  const [age, setAge] = useState('0')
  const [female, setFemale] = useState(false)
  const [cr, setCr] = useState('0')
  const [calcium, setCalcium] = useState(false)
  const [ck, setCk] = useState(false)
  const [cause, setCause] = useState(false)
  const [phosphate, setPhosphate] = useState('0')
  const [bicarb, setBicarb] = useState(false)

  const result = useMemo(() => {
    const score = Number(age) + (female ? 1 : 0) + Number(cr) + (calcium ? 2 : 0) +
      (ck ? 2 : 0) + (cause ? 3 : 0) + Number(phosphate) + (bicarb ? 2 : 0)
    if (score >= 6) return { score, severity: 'dn' as const, label: '高リスク（≧6）: 腎不全または院内死亡のリスクが高い（PPV 29.6%）' }
    return { score, severity: 'ok' as const, label: '低リスク（<6）: 腎不全または院内死亡のリスクが低い（NPV 97.0%）' }
  }, [age, female, cr, calcium, ck, cause, phosphate, bicarb])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="McMahon" value={result.score} unit="点" interpretation={result.label} severity={result.severity} />}
      explanation={<div className="text-sm text-muted"><p>横紋筋融解症患者の腎不全・院内死亡リスク予測。スコアが低くても臨床経過や併存疾患の追加評価が必要。</p></div>}
      relatedTools={[]} references={[{text:'McMahon GM et al. A risk prediction score for kidney failure or mortality in rhabdomyolysis. JAMA Intern Med 2013;173:1821-1828. PMID: 24000014'}]}
    >
      <div className="space-y-3">
        <RadioGroup name="age" label="年齢" value={age} onChange={setAge} options={[
          { value: '0', label: '≦50歳（0点）' },
          { value: '1.5', label: '51-70歳（+1.5点）' },
          { value: '2.5', label: '71-80歳（+2.5点）' },
          { value: '3', label: '≧81歳（+3点）' },
        ]} />
        <CheckItem id="female" label="女性（+1点）" checked={female} onChange={setFemale} />
        <RadioGroup name="cr" label="初期クレアチニン" value={cr} onChange={setCr} options={[
          { value: '0', label: '< 1.4 mg/dL（0点）' },
          { value: '1.5', label: '1.4-2.2 mg/dL（+1.5点）' },
          { value: '3', label: '> 2.2 mg/dL（+3点）' },
        ]} />
        <CheckItem id="calcium" label="初期Ca < 7.5 mg/dL（+2点）" checked={calcium} onChange={setCalcium} />
        <CheckItem id="ck" label="初期CPK > 40,000 U/L（+2点）" checked={ck} onChange={setCk} />
        <CheckItem id="cause" label="原因: 痙攣・失神・運動・スタチン・筋炎以外（+3点）" sublabel="痙攣・失神・運動・スタチン・筋炎が原因の場合はチェックしない" checked={cause} onChange={setCause} />
        <RadioGroup name="phosphate" label="初期リン酸塩" value={phosphate} onChange={setPhosphate} options={[
          { value: '0', label: '< 4.0 mg/dL（0点）' },
          { value: '1.5', label: '4.0-5.4 mg/dL（+1.5点）' },
          { value: '3', label: '> 5.4 mg/dL（+3点）' },
        ]} />
        <CheckItem id="bicarb" label="初期重炭酸塩 < 19 mEq/L（+2点）" checked={bicarb} onChange={setBicarb} />
      </div>
    </CalculatorLayout>
  )
}
