'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { SelectInput, CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('mascc')!

export default function MasccPage() {
  const [burden, setBurden] = useState('5')
  const [hypotension, setHypotension] = useState(false)
  const [copd, setCopd] = useState(false)
  const [solid, setSolid] = useState(false)
  const [fungal, setFungal] = useState(false)
  const [dehydration, setDehydration] = useState(false)
  const [outpatient, setOutpatient] = useState(true)
  const [age60, setAge60] = useState(false)

  const result = useMemo(() => {
    let score = parseInt(burden)
    if (!hypotension) score += 5
    if (!copd) score += 4
    if (solid || !fungal) score += 4
    if (!dehydration) score += 3
    if (outpatient) score += 3
    if (!age60) score += 2

    const lowRisk = score >= 21
    const severity: 'ok'|'wn'|'dn' = lowRisk ? 'ok' : 'dn'
    const label = lowRisk
      ? '低リスク（≥21点）— 外来治療を検討可能'
      : '高リスク（<21点）— 入院治療が必要'
    const complication = lowRisk ? '重篤合併症 <5%' : '重篤合併症 >5%'
    return { score, severity, label, complication }
  }, [burden, hypotension, copd, solid, fungal, dehydration, outpatient, age60])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="MASCC Score" value={result.score} unit="/ 26点" interpretation={result.label} severity={result.severity}
        details={[{ label: 'リスク', value: result.complication }]} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">MASCC Risk Indexとは</h2>
          <p>発熱性好中球減少症（FN）患者の重篤合併症リスクを評価するスコアです。21点以上を低リスクとし、外来での経口抗菌薬治療を検討できます。IDSAガイドラインでも示されています。</p>
          <h3 className="font-bold text-tx">判定</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>≥21点: 低リスク — 外来経口抗菌薬治療を検討</li>
            <li>&lt;21点: 高リスク — 入院・静注抗菌薬が標準</li>
          </ul>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Klastersky J, et al. J Clin Oncol 2000;18:3038-3051' }]}
    >
      <div className="space-y-4">
        <SelectInput id="burden" label="症状の程度（Burden of illness）" value={burden} onChange={setBurden}
          options={[
            { value: '5', label: '5 — 軽症 or 無症状' },
            { value: '3', label: '3 — 中等症' },
            { value: '0', label: '0 — 重症（瀕死状態）' },
          ]} />
        <CheckItem id="hypotension" label="低血圧あり（SBP < 90）" sublabel="チェックなし = +5点" points={0} checked={hypotension} onChange={setHypotension} />
        <CheckItem id="copd" label="COPD あり" sublabel="チェックなし = +4点" points={0} checked={copd} onChange={setCopd} />
        <CheckItem id="solid" label="固形がん（血液がんではない）" sublabel="チェックあり = +4点" points={4} checked={solid} onChange={setSolid} />
        <CheckItem id="dehydration" label="脱水あり（輸液が必要）" sublabel="チェックなし = +3点" points={0} checked={dehydration} onChange={setDehydration} />
        <CheckItem id="outpatient" label="FN発症時に外来だった" sublabel="チェックあり = +3点" points={3} checked={outpatient} onChange={setOutpatient} />
        <CheckItem id="age60" label="年齢 ≥ 60歳" sublabel="チェックなし = +2点" points={0} checked={age60} onChange={setAge60} />
      </div>
    </CalculatorLayout>
  )
}
