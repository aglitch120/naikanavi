'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, SelectInput } from '@/components/tools/InputFields'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('glasgow-blatchford')!

export default function GlasgowBlatchfordPage() {
  const [bun, setBun] = useState('20')
  const [hb, setHb] = useState('13')
  const [sex, setSex] = useState('male')
  const [sbp, setSbp] = useState('120')
  const [hr, setHr] = useState('80')
  const [melena, setMelena] = useState(false)
  const [syncope, setSyncope] = useState(false)
  const [liver, setLiver] = useState(false)
  const [heartFailure, setHeartFailure] = useState(false)

  const result = useMemo(() => {
    const b = parseFloat(bun) || 0
    const h = parseFloat(hb) || 0
    const s = parseInt(sbp) || 120
    const heartRate = parseInt(hr) || 80
    let score = 0

    // BUN: mg/dL入力 → mmol/Lに変換して原著閾値と比較
    const bunMmol = b / 2.8
    if (bunMmol >= 25) score += 6
    else if (bunMmol >= 10) score += 4
    else if (bunMmol >= 8) score += 3
    else if (bunMmol >= 6.5) score += 2

    // Hb
    if (sex === 'male') {
      if (h < 10) score += 6
      else if (h < 12) score += 3
      else if (h < 13) score += 1
    } else {
      if (h < 10) score += 6
      else if (h < 12) score += 1
    }

    // SBP
    if (s < 90) score += 3
    else if (s < 100) score += 2
    else if (s < 110) score += 1

    // HR
    if (heartRate >= 100) score += 1

    // Other
    if (melena) score += 1
    if (syncope) score += 2
    if (liver) score += 2
    if (heartFailure) score += 2

    const severity: 'ok' | 'wn' | 'dn' = score === 0 ? 'ok' : score <= 6 ? 'wn' : 'dn'
    const label = score === 0
      ? '低リスク'
      : score <= 6
        ? '中リスク'
        : '高リスク'

    return { score, severity, label }
  }, [bun, hb, sex, sbp, hr, melena, syncope, liver, heartFailure])

  return (
    <CalculatorLayout
      slug={toolDef.slug}
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={
        <ResultCard label="Glasgow-Blatchford" value={result.score} unit="/ 23点"
          interpretation={result.label} severity={result.severity}
          details={[{ label: '注目', value: 'スコア0 = 低リスク（最終判断は臨床医による）' }]} />
      }
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Blatchford O, et al. Lancet 2000;356:1318-1321' }]}
    >
      <div className="space-y-4">
        <NumberInput id="bun" label="BUN" unit="mg/dL" hint="日本の検査値をそのまま入力" value={bun} onChange={setBun} step={0.1} />
        <NumberInput id="hb" label="Hb" unit="g/dL" value={hb} onChange={setHb} step={0.1} />
        <SelectInput id="sex" label="性別" value={sex} onChange={setSex} options={[{ value: 'male', label: '男性' }, { value: 'female', label: '女性' }]} />
        <NumberInput id="sbp" label="収縮期血圧" unit="mmHg" value={sbp} onChange={setSbp} step={1} />
        <NumberInput id="hr" label="心拍数" unit="/min" value={hr} onChange={setHr} step={1} />
        <CheckItem id="melena" label="下血あり" points={1} checked={melena} onChange={setMelena} />
        <CheckItem id="syncope" label="失神あり" points={2} checked={syncope} onChange={setSyncope} />
        <CheckItem id="liver" label="肝疾患あり" points={2} checked={liver} onChange={setLiver} />
        <CheckItem id="hf" label="心不全あり" points={2} checked={heartFailure} onChange={setHeartFailure} />
      </div>
    </CalculatorLayout>
  )
}
