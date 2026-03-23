'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('aldrete')!
const items = [
  { name: '活動性 (Activity)', options: [
    { label: '四肢を自発的に動かせる', score: 2 },
    { label: '二肢を自発的に動かせる', score: 1 },
    { label: '四肢を動かせない', score: 0 },
  ]},
  { name: '呼吸 (Respiration)', options: [
    { label: '深呼吸・咳嗽可能', score: 2 },
    { label: '呼吸困難・浅い呼吸', score: 1 },
    { label: '無呼吸', score: 0 },
  ]},
  { name: '循環 (Circulation)', options: [
    { label: '血圧が術前の±20%以内', score: 2 },
    { label: '血圧が術前の±20-50%', score: 1 },
    { label: '血圧が術前の±50%超', score: 0 },
  ]},
  { name: '意識 (Consciousness)', options: [
    { label: '完全覚醒', score: 2 },
    { label: '呼びかけで覚醒', score: 1 },
    { label: '反応なし', score: 0 },
  ]},
  { name: 'SpO₂', options: [
    { label: 'SpO₂ > 92% (室内気)', score: 2 },
    { label: 'SpO₂ > 90% (酸素投与下)', score: 1 },
    { label: 'SpO₂ < 90%', score: 0 },
  ]},
]
export default function AldretePage() {
  const [scores, setScores] = useState([2, 2, 2, 2, 2])
  const result = useMemo(() => {
    const total = scores.reduce((a, b) => a + b, 0)
    let severity: 'ok' | 'wn' | 'dn' = 'ok', interpretation = ''
    if (total >= 9) { interpretation = `${total}/10 — PACU退室可` }
    else if (total >= 7) { interpretation = `${total}/10 — 退室基準未達。経過観察継続`; severity = 'wn' }
    else { interpretation = `${total}/10 — 回復不十分。集中的モニタリング継続`; severity = 'dn' }
    return { total, severity, interpretation }
  }, [scores])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={`Aldrete = ${result.total}/10`} interpretation={result.interpretation} />}
      explanation={<div className="text-sm text-muted"><p>≧9点でPACU退室可。5項目各0-2点（計10点）。</p></div>}
      relatedTools={[{ href: '/tools/calc/asa-ps', name: 'ASA-PS' }, { href: '/tools/calc/gcs', name: 'GCS' }]}
      references={toolDef.sources || []}
    >
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i}>
            <p className="text-sm font-bold text-tx mb-1.5">{item.name}</p>
            <div className="space-y-1">
              {item.options.map((opt, j) => (
                <label key={j} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all ${scores[i] === opt.score ? 'bg-acl border border-ac/30' : 'bg-s0 border border-br hover:border-ac/20'}`}>
                  <input type="radio" name={`item-${i}`} checked={scores[i] === opt.score} onChange={() => { const ns = [...scores]; ns[i] = opt.score; setScores(ns) }}
                    className="mt-0.5 accent-[var(--ac)]" />
                  <span className="text-xs text-tx">{opt.label} <span className="text-muted">({opt.score}点)</span></span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CalculatorLayout>
  )
}
