'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('heart-score')!

const items = [
  { id: 'history', label: 'H: 病歴（History）', options: [
    { value: '0', label: '0 — やや疑わしい' }, { value: '1', label: '1 — 中等度に疑わしい' }, { value: '2', label: '2 — 強く疑わしい' }] },
  { id: 'ecg', label: 'E: 心電図（ECG）', options: [
    { value: '0', label: '0 — 正常' }, { value: '1', label: '1 — 非特異的ST変化' }, { value: '2', label: '2 — 有意なST偏位' }] },
  { id: 'age', label: 'A: 年齢（Age）', options: [
    { value: '0', label: '0 — < 45歳' }, { value: '1', label: '1 — 45-64歳' }, { value: '2', label: '2 — ≥ 65歳' }] },
  { id: 'risk', label: 'R: リスク因子（Risk factors）', options: [
    { value: '0', label: '0 — リスク因子なし' }, { value: '1', label: '1 — 1-2個' }, { value: '2', label: '2 — ≥3個 or 動脈硬化既往' }] },
  { id: 'troponin', label: 'T: トロポニン（Troponin）', options: [
    { value: '0', label: '0 — 正常範囲' }, { value: '1', label: '1 — 1-3倍上昇' }, { value: '2', label: '2 — >3倍上昇' }] },
]

export default function HeartScorePage() {
  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(items.map(i => [i.id, '0']))
  )
  const result = useMemo(() => {
    const total = Object.values(scores).reduce((a, b) => a + parseInt(b), 0)
    const mace = total <= 3 ? '1.7%' : total <= 6 ? '12-16%' : '50-65%'
    const severity: 'ok' | 'wn' | 'dn' = total <= 3 ? 'ok' : total <= 6 ? 'wn' : 'dn'
    const label = total <= 3 ? '低リスク — 早期退院を検討' : total <= 6 ? '中リスク — 入院・精査を検討' : '高リスク — 早期侵襲的治療を検討'
    return { total, mace, severity, label }
  }, [scores])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="HEART Score" value={result.total} unit="/ 10点" interpretation={result.label} severity={result.severity}
        details={[{ label: '6週間MACE発生率', value: result.mace }]} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">HEART Scoreとは</h2>
          <p>ER受診の胸痛患者におけるMACE（主要心血管イベント）リスクを評価するスコア。History, ECG, Age, Risk factors, Troponinの5項目で構成。低リスク（0-3点）患者の安全な早期退院を支援します。</p>
          <h3 className="font-bold text-tx">リスク分類</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>0-3点: 低リスク（MACE 1.7%）— 退院・外来フォロー検討</li>
            <li>4-6点: 中リスク（MACE 12-16%）— 入院・追加検査</li>
            <li>7-10点: 高リスク（MACE 50-65%）— 早期侵襲的戦略</li>
          </ul>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Six AJ, et al. Neth Heart J 2008;16:191-196' }, { text: 'Backus BE, et al. Int J Cardiol 2013;168:2153-2158' }]}
    >
      <div className="space-y-4">
        {items.map(item => (
          <SelectInput key={item.id} id={item.id} label={item.label} value={scores[item.id]}
            onChange={v => setScores(prev => ({ ...prev, [item.id]: v }))} options={item.options} />
        ))}
      </div>
    </CalculatorLayout>
  )
}
