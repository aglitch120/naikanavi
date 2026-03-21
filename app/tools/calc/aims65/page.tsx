'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('aims65')!

export default function Aims65Page() {
  const [alb, setAlb] = useState(false)
  const [inr, setInr] = useState(false)
  const [ms, setMs] = useState(false)
  const [sbp, setSbp] = useState(false)
  const [age, setAge] = useState(false)

  const result = useMemo(() => {
    const score = [alb, inr, ms, sbp, age].filter(Boolean).length
    const mortality = ['0.3%', '1.2%', '5.3%', '10.3%', '24.5%', '39.8%'][score]
    const severity: 'ok' | 'wn' | 'dn' = score <= 1 ? 'ok' : score <= 3 ? 'wn' : 'dn'
    return { score, mortality, severity }
  }, [alb, inr, ms, sbp, age])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="AIMS65" value={result.score} unit="/ 5点" interpretation={`院内死亡率: ${result.mortality}`} severity={result.severity} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">AIMS65とは</h2>
          <p>上部消化管出血の院内死亡率を予測する5項目のスコア。Albumin, INR, Mental status, SBP, Age ≥65の頭文字。シンプルで暗記しやすく、ERでの迅速評価に適します。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Saltzman JR, et al. Gastrointest Endosc 2011;74:1215-1224' }]}
    >
      <div className="space-y-3">
        <CheckItem id="alb" label="A: Alb < 3.0 g/dL" points={1} checked={alb} onChange={setAlb} />
        <CheckItem id="inr" label="I: INR > 1.5" points={1} checked={inr} onChange={setInr} />
        <CheckItem id="ms" label="M: 意識障害 (Mental status altered)" points={1} checked={ms} onChange={setMs} />
        <CheckItem id="sbp" label="S: 収縮期血圧 ≤ 90 mmHg" points={1} checked={sbp} onChange={setSbp} />
        <CheckItem id="age" label="65: 年齢 ≥ 65歳" points={1} checked={age} onChange={setAge} />
      </div>
    </CalculatorLayout>
  )
}
