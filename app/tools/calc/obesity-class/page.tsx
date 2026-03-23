'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('obesity-class')!
export default function ObesityClassPage() {
  const [height, setHeight] = useState('170')
  const [weight, setWeight] = useState('80')
  const result = useMemo(() => {
    const h = parseFloat(height)/100, w = parseFloat(weight)
    if (!h || !w) return null
    const bmi = w/(h*h)
    let jpnClass = '', whoClass = '', severity: 'ok'|'wn'|'dn' = 'ok'
    if (bmi < 18.5) { jpnClass = '低体重'; whoClass = 'Underweight'; severity = 'wn' }
    else if (bmi < 25) { jpnClass = '普通体重'; whoClass = 'Normal' }
    else if (bmi < 30) { jpnClass = '肥満(1度)'; whoClass = 'Pre-obese'; severity = 'wn' }
    else if (bmi < 35) { jpnClass = '肥満(2度)'; whoClass = 'Obese class I'; severity = 'dn' }
    else if (bmi < 40) { jpnClass = '肥満(3度)'; whoClass = 'Obese class II'; severity = 'dn' }
    else { jpnClass = '肥満(4度)'; whoClass = 'Obese class III'; severity = 'dn' }
    const ibw = 22 * h * h
    return { bmi: bmi.toFixed(1), jpnClass, whoClass, ibw: ibw.toFixed(1), severity }
  }, [height, weight])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity={result.severity} value={`BMI = ${result.bmi} → ${result.jpnClass}`}
        interpretation={`WHO分類: ${result.whoClass}\n標準体重(BMI22): ${result.ibw} kg\n\n日本肥満学会:\n <18.5: 低体重\n 18.5-25: 普通\n 25-30: 肥満1度\n 30-35: 肥満2度\n 35-40: 肥満3度\n ≧40: 肥満4度`} /> : null}
      explanation={<div className="text-sm text-muted"><p>日本人ではBMI≧25で肥満。WHO基準(≧30)とは異なる。BMI≧35は高度肥満で外科的治療の適応を検討。</p></div>}
      relatedTools={[{slug:'bmi',name:'BMI'},{slug:'bsa',name:'BSA'}]}
      references={toolDef.sources||[]}
    >
      <NumberInput label="身長 (cm)" value={height} onChange={setHeight} />
      <NumberInput label="体重 (kg)" value={weight} onChange={setWeight} />
    </CalculatorLayout>
  )
}
