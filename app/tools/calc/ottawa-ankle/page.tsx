'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('ottawa-ankle')!

const ankleCriteria = [
  { id: 'a1', label: '外果後縁 or 先端から6cm以内の骨圧痛' },
  { id: 'a2', label: '内果後縁 or 先端から6cm以内の骨圧痛' },
  { id: 'a3', label: '受傷直後に4歩以上歩行不能' },
]
const footCriteria = [
  { id: 'f1', label: '第5中足骨基部の骨圧痛' },
  { id: 'f2', label: '舟状骨の骨圧痛' },
  { id: 'f3', label: '受傷直後に4歩以上歩行不能' },
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
    if (!anyPos) label = '全項目陰性 — X線不要（感度 ~98%）'
    else if (anklePos && footPos) label = '足関節+足部ともに陽性 — 両方のX線を検討'
    else if (anklePos) label = '足関節陽性 — 足関節X線を検討'
    else label = '足部陽性 — 足部X線を検討'
    return { anyPos, anklePos, footPos, severity, label }
  }, [ankleChecks, footChecks])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Ottawa Ankle Rules" value={result.anyPos ? 'X線検討' : 'X線不要'} unit="" interpretation={result.label} severity={result.severity} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">Ottawa Ankle Rulesとは</h2>
          <p>足関節・足部外傷患者にX線検査が必要かどうかを判断する臨床決定ルールです。感度約98%で骨折を除外でき、不要なX線検査を30-40%削減するエビデンスがあります。</p>
          <h3 className="font-bold text-tx">適用対象</h3>
          <p>足関節・足部の外傷で受診した成人患者。小児（&lt;18歳）や妊婦にはデータ限定的。意識障害・多発外傷・糖尿病性ニューロパチー等の患者には適用しないこと。</p>
        </section>
      }
      relatedTools={[]} references={[{ text: 'Stiell IG, et al. JAMA 1994;271:827-832' }]}
    >
      <div className="space-y-4">
        <div className="text-xs font-medium text-muted uppercase tracking-wider">足関節（Ankle）</div>
        <div className="space-y-2">{ankleCriteria.map(c => <CheckItem key={c.id} id={c.id} label={c.label} points={1} checked={ankleChecks[c.id]} onChange={v => setAnkleChecks(p => ({...p,[c.id]:v}))} />)}</div>
        <div className="text-xs font-medium text-muted uppercase tracking-wider">足部（Foot）</div>
        <div className="space-y-2">{footCriteria.map(c => <CheckItem key={c.id} id={c.id} label={c.label} points={1} checked={footChecks[c.id]} onChange={v => setFootChecks(p => ({...p,[c.id]:v}))} />)}</div>
      </div>
    </CalculatorLayout>
  )
}
