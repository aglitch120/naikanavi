'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('isth-dic')!

export default function IsthDicPage() {
  const [plt, setPlt] = useState('0')
  const [fdp, setFdp] = useState('0')
  const [pt, setPt] = useState('0')
  const [fib, setFib] = useState('0')

  const result = useMemo(() => {
    const score = [plt, fdp, pt, fib].reduce((a, b) => a + parseInt(b), 0)
    const overt = score >= 5
    const severity: 'ok'|'wn'|'dn' = overt ? 'dn' : score >= 3 ? 'wn' : 'ok'
    const label = overt ? 'Overt DIC（≥5点）— 治療は担当医が判断' : score >= 3 ? 'DIC疑い（3-4点）' : 'DICの可能性低い（<3点）'
    return { score, severity, label, overt }
  }, [plt, fdp, pt, fib])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="ISTH DIC Score" value={result.score} unit="/ 8点" interpretation={result.label} severity={result.severity}
        details={[{ label: '判定', value: result.overt ? 'Overt DIC' : 'Non-overt' }]} />}
      explanation="日本臨床ではJSTH急性期DIC診断基準が主流です。本ツールはISTH基準（国際標準）を使用しており、閾値・配点がJSTH基準と異なります。"
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Taylor FB Jr, et al. Thromb Haemost 2001;86:1327-1330' }, { text: '※日本ではJSTH急性期DIC基準が主流。ISTHスコアとは閾値・配点が異なる' }]}
    >
      <div className="space-y-4">
        <SelectInput id="plt" label="血小板数" value={plt} onChange={setPlt} options={[
          { value: '0', label: '0 — ≥ 100,000/μL' },
          { value: '1', label: '1 — 50,000-100,000/μL' },
          { value: '2', label: '2 — < 50,000/μL' },
        ]} />
        <SelectInput id="fdp" label="FDP / D-dimer 上昇" value={fdp} onChange={setFdp} options={[
          { value: '0', label: '0 — 正常範囲' },
          { value: '2', label: '2 — 中等度上昇' },
          { value: '3', label: '3 — 著明上昇' },
        ]} />
        <SelectInput id="pt" label="PT延長" value={pt} onChange={setPt} options={[
          { value: '0', label: '0 — < 3秒延長' },
          { value: '1', label: '1 — 3-6秒延長' },
          { value: '2', label: '2 — > 6秒延長' },
        ]} />
        <SelectInput id="fib" label="フィブリノゲン" value={fib} onChange={setFib} options={[
          { value: '0', label: '0 — ≥ 100 mg/dL' },
          { value: '1', label: '1 — < 100 mg/dL' },
        ]} />
      </div>
    </CalculatorLayout>
  )
}
