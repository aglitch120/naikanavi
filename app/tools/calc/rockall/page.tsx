'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('rockall')!

export default function RockallPage() {
  const [age, setAge] = useState('0')
  const [shock, setShock] = useState('0')
  const [comorbidity, setComorbidity] = useState('0')
  const [diagnosis, setDiagnosis] = useState('0')
  const [stigmata, setStigmata] = useState('0')

  const result = useMemo(() => {
    const score = [age, shock, comorbidity, diagnosis, stigmata].reduce((a, b) => a + parseInt(b), 0)
    const severity: 'ok'|'wn'|'dn' = score <= 2 ? 'ok' : score <= 5 ? 'wn' : 'dn'
    const label = score <= 2 ? '低リスク — 再出血率 <5%、死亡率 <1%' : score <= 5 ? '中リスク — 再出血率 ~25%、死亡率 ~10%' : '高リスク — 再出血率 >40%、死亡率 >20%'
    return { score, severity, label }
  }, [age, shock, comorbidity, diagnosis, stigmata])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Rockall Score" value={result.score} unit="/ 11点" interpretation={result.label} severity={result.severity} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">Rockall スコアとは</h2>
          <p>上部消化管出血の内視鏡後に再出血および死亡のリスクを予測するスコアです。内視鏡前（臨床的Rockall: 0-7点）と内視鏡後（完全版: 0-11点）の2種類があります。本ツールは完全版です。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Rockall TA, et al. Gut 1996;38:316-321' }]}
    >
      <div className="space-y-4">
        <SelectInput id="age" label="年齢" value={age} onChange={setAge} options={[
          { value: '0', label: '0 — < 60歳' }, { value: '1', label: '1 — 60-79歳' }, { value: '2', label: '2 — ≥ 80歳' }]} />
        <SelectInput id="shock" label="ショック" value={shock} onChange={setShock} options={[
          { value: '0', label: '0 — ショックなし（SBP≥100, HR<100）' }, { value: '1', label: '1 — 頻脈（HR≥100, SBP≥100）' }, { value: '2', label: '2 — 低血圧（SBP<100）' }]} />
        <SelectInput id="comorbidity" label="併存疾患" value={comorbidity} onChange={setComorbidity} options={[
          { value: '0', label: '0 — 重大な併存疾患なし' }, { value: '2', label: '2 — 心不全・虚血性心疾患・重大疾患' }, { value: '3', label: '3 — 腎不全・肝不全・播種性悪性腫瘍' }]} />
        <SelectInput id="diagnosis" label="内視鏡診断" value={diagnosis} onChange={setDiagnosis} options={[
          { value: '0', label: '0 — Mallory-Weiss・病変なし' }, { value: '1', label: '1 — その他の診断' }, { value: '2', label: '2 — 上部消化管悪性腫瘍' }]} />
        <SelectInput id="stigmata" label="出血徴候" value={stigmata} onChange={setStigmata} options={[
          { value: '0', label: '0 — なし or 暗色基底' }, { value: '2', label: '2 — 活動性出血・露出血管・凝血塊付着' }]} />
      </div>
    </CalculatorLayout>
  )
}
