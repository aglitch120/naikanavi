'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('ottawa-ankle')!

const ankleCriteria = [
  { id: 'a1', label: '腓骨遠位端より6cmまで後方の圧痛（A）' },
  { id: 'a2', label: '脛骨遠位端より6cmまで後方の圧痛（B）' },
  { id: 'a3', label: '受傷時および受診時に患肢に荷重不可' },
]
const footCriteria = [
  { id: 'f1', label: '第5中足骨基部の圧痛（C）' },
  { id: 'f2', label: '舟状骨の圧痛（D）' },
  { id: 'f3', label: '受傷時および受診時に患肢に荷重不可' },
]

export default function OttawaAnklePage() {
  const [ankleChecks, setAnkleChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(ankleCriteria.map(c => [c.id, false]))
  )
  const [footChecks, setFootChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(footCriteria.map(c => [c.id, false]))
  )
  const result = useMemo(() => {
    const anklePos = ankleCriteria.some(c => ankleChecks[c.id])
    const footPos = footCriteria.some(c => footChecks[c.id])
    const anyPos = anklePos || footPos
    const severity: 'ok'|'wn'|'dn' = anyPos ? 'dn' : 'ok'
    let label = ''
    if (!anyPos) label = '全項目陰性 — X線不要（感度 97.6%）'
    else if (anklePos && footPos) label = '足関節X線+足部X線の撮影を推奨'
    else if (anklePos) label = '足関節X線の撮影を推奨'
    else label = '足部X線の撮影を推奨'
    return { anyPos, anklePos, footPos, severity, label }
  }, [ankleChecks, footChecks])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Ottawa Ankle Rules" value={result.anyPos ? 'X線撮影を推奨' : 'X線不要（感度97.6%）'} interpretation={result.label} severity={result.severity} />}
      explanation={<div className="text-sm text-muted"><p className="text-xs text-wn">注意: 臨床的に重要でない軽微な骨折（3mm以下の剥離骨折など）の否定や、固定免荷が不要かを予測するスコアではない。</p></div>}
      relatedTools={[]} references={[
        { text: 'Stiell IG, et al. Implementation of the Ottawa ankle rules. JAMA 1994;271:827-832' },
        { text: 'Bachmann LM, et al. Accuracy of Ottawa ankle rules to exclude fractures. BMJ 2003;326:417 (感度97.6%, 特異度31.5%)' },
      ]}
    >
      <div className="space-y-4">
        <p className="text-xs font-bold text-ac">足関節の評価（いずれか1つ → 足関節X線）</p>
        <div className="space-y-1">{ankleCriteria.map(c => <CheckItem key={c.id} id={c.id} label={c.label} checked={ankleChecks[c.id]} onChange={v => setAnkleChecks(p => ({...p,[c.id]:v}))} />)}</div>
        <p className="text-xs font-bold text-ac mt-3">中足部の評価（いずれか1つ → 足部X線）</p>
        <div className="space-y-1">{footCriteria.map(c => <CheckItem key={c.id} id={c.id} label={c.label} checked={footChecks[c.id]} onChange={v => setFootChecks(p => ({...p,[c.id]:v}))} />)}</div>
      </div>
    </CalculatorLayout>
  )
}
