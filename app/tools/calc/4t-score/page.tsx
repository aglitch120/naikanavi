'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('4t-score')!
const items = [
  { name: 'Thrombocytopenia（血小板減少）', options: [
    { label: 'Plt 50%以上低下 かつ nadir ≧20,000', score: 2 },
    { label: 'Plt 30-50%低下 or nadir 10,000-19,000', score: 1 },
    { label: 'Plt 30%未満低下 or nadir <10,000', score: 0 },
  ]},
  { name: 'Timing（発症時期）', options: [
    { label: 'ヘパリン開始5-10日 or 1日以内（30日以内に曝露歴あり）', score: 2 },
    { label: '10日以降 or 不明 or 1日以内（30-100日前に曝露）', score: 1 },
    { label: '4日以内（最近の曝露なし）', score: 0 },
  ]},
  { name: 'Thrombosis（血栓症）', options: [
    { label: '新規血栓 or 皮膚壊死 or 急性全身反応', score: 2 },
    { label: '進行性/再発性血栓 or 紅斑性皮膚病変 or 未確認の血栓疑い', score: 1 },
    { label: 'なし', score: 0 },
  ]},
  { name: 'oTher cause（他の原因）', options: [
    { label: '他に明らかな原因なし', score: 2 },
    { label: '他に原因の可能性あり', score: 1 },
    { label: '他に確実な原因あり', score: 0 },
  ]},
]
export default function FourTScorePage() {
  const [scores, setScores] = useState([2, 2, 0, 2])
  const result = useMemo(() => {
    const total = scores.reduce((a, b) => a + b, 0)
    let severity: 'ok' | 'wn' | 'dn' = 'ok', interpretation = ''
    if (total >= 6) { interpretation = `${total}点 — 高確率 (HIT確率 >50%)。ヘパリン中止+代替抗凝固薬+HIT抗体検査`; severity = 'dn' }
    else if (total >= 4) { interpretation = `${total}点 — 中間確率 (HIT確率 ~14%)。HIT抗体検査を提出。結果まで代替抗凝固薬考慮`; severity = 'wn' }
    else { interpretation = `${total}点 — 低確率 (HIT確率 <5%)。HITの可能性は低い。他の原因検索`; }
    return { total, severity, interpretation }
  }, [scores])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={`4T's = ${result.total}点`} interpretation={result.interpretation} />}
      explanation={<div className="text-sm text-muted"><p>0-3: 低確率 / 4-5: 中間確率 / 6-8: 高確率。陰性予測値が高く、低スコアでHITを除外できる。</p></div>}
      relatedTools={[{ href: '/tools/calc/isth-dic', name: 'ISTH DIC' }, { href: '/tools/calc/plt-transfusion', name: 'PLT輸血' }]}
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
