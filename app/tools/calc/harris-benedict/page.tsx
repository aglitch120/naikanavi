'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, RadioGroup, SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('harris-benedict')!

const stressFactors = [
  { value: 'bed', label: '安静臥床（×1.2）', factor: 1.2 },
  { value: 'ambulatory', label: '軽度活動（×1.3）', factor: 1.3 },
  { value: 'minor', label: '小手術（×1.2）', factor: 1.2 },
  { value: 'major', label: '大手術（×1.4）', factor: 1.4 },
  { value: 'infection', label: '感染症（×1.3）', factor: 1.3 },
  { value: 'sepsis', label: '敗血症（×1.5）', factor: 1.5 },
  { value: 'burn', label: '熱傷（×1.8）', factor: 1.8 },
  { value: 'trauma', label: '多発外傷（×1.5）', factor: 1.5 },
]

export default function HarrisBenedictPage() {
  const [sex, setSex] = useState('male')
  const [age, setAge] = useState('55')
  const [height, setHeight] = useState('170')
  const [weight, setWeight] = useState('65')
  const [stress, setStress] = useState('bed')

  const result = useMemo(() => {
    const a = parseFloat(age); const h = parseFloat(height); const w = parseFloat(weight)
    if (!a || !h || !w) return null
    const bee = sex === 'male'
      ? 66.47 + 13.75 * w + 5.0 * h - 6.76 * a
      : 655.1 + 9.56 * w + 1.85 * h - 4.68 * a
    const sf = stressFactors.find(s => s.value === stress)!
    const tee = bee * sf.factor
    return { bee: Math.round(bee), tee: Math.round(tee), factor: sf.factor }
  }, [sex, age, height, weight, stress])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result && (<ResultCard label="TEE（総エネルギー）" value={result.tee} unit="kcal/日"
        interpretation={`BEE ${result.bee} kcal × 係数 ${result.factor}`} severity="neutral"
        details={[{ label: 'BEE（基礎代謝）', value: `${result.bee} kcal/日` }]} />)}
      explanation={<section className="space-y-4 text-sm text-muted">
        <h2 className="text-base font-bold text-tx">Harris-Benedict式とは</h2>
        <p>基礎エネルギー消費量（BEE）を推算する古典的な式。TEE = BEE × 活動/ストレス係数。栄養管理の基本。</p>
        <p className="font-mono bg-bg p-2 rounded text-xs">男性: BEE = 66.47 + 13.75×W + 5.0×H - 6.76×A</p>
        <p className="font-mono bg-bg p-2 rounded text-xs mt-1">女性: BEE = 655.1 + 9.56×W + 1.85×H - 4.68×A</p>
      </section>}
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Harris JA, Benedict FG. Proc Natl Acad Sci 1918;4:370-373' }]}
    >
      <div className="space-y-4">
        <RadioGroup label="性別" name="sex" value={sex} onChange={setSex} options={[{ value: 'male', label: '男性' }, { value: 'female', label: '女性' }]} />
        <NumberInput id="age" label="年齢" unit="歳" value={age} onChange={setAge} />
        <NumberInput id="height" label="身長" unit="cm" value={height} onChange={setHeight} />
        <NumberInput id="weight" label="体重" unit="kg" value={weight} onChange={setWeight} />
        <SelectInput id="stress" label="活動/ストレス係数" value={stress} onChange={setStress}
          options={stressFactors.map(s => ({ value: s.value, label: s.label }))} />
      </div>
    </CalculatorLayout>
  )
}
