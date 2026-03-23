'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('mmse')!
const sections = [
  { name: '時間の見当識', max: 5, desc: '年/季節/月/日/曜日（各1点）' },
  { name: '場所の見当識', max: 5, desc: '都道府県/市区町村/病院名/階/地方（各1点）' },
  { name: '即時記銘', max: 3, desc: '3単語の復唱（各1点）' },
  { name: '注意力と計算', max: 5, desc: '100から7を順に引く ×5回（各1点）' },
  { name: '遅延再生', max: 3, desc: '3単語の想起（各1点）' },
  { name: '呼称', max: 2, desc: '時計・鉛筆の名称（各1点）' },
  { name: '復唱', max: 1, desc: '「みんなで力を合わせて綱を引きます」' },
  { name: '3段階命令', max: 3, desc: '「右手で紙を取り、半分に折り、机の上に置く」' },
  { name: '読字', max: 1, desc: '「目を閉じてください」を読んで実行' },
  { name: '書字', max: 1, desc: '文章を書く' },
  { name: '図形模写', max: 1, desc: '五角形2つの重なりを模写' },
]
export default function MmsePage() {
  const [scores, setScores] = useState(sections.map(s => s.max))
  const result = useMemo(() => {
    const total = scores.reduce((a, b) => a + b, 0)
    let severity: 'ok' | 'wn' | 'dn' = 'ok', interpretation = ''
    if (total >= 27) { interpretation = `${total}/30 — 正常範囲` }
    else if (total >= 24) { interpretation = `${total}/30 — 軽度認知機能低下（MCI疑い）`; severity = 'wn' }
    else if (total >= 20) { interpretation = `${total}/30 — 軽度認知症`; severity = 'wn' }
    else if (total >= 10) { interpretation = `${total}/30 — 中等度認知症`; severity = 'dn' }
    else { interpretation = `${total}/30 — 重度認知症`; severity = 'dn' }
    return { total, severity, interpretation }
  }, [scores])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={`MMSE = ${result.total}/30`} interpretation={result.interpretation} />}
      explanation={<div className="text-sm text-muted"><p>23/24点をカットオフとして認知症のスクリーニングに使用。教育歴の影響を受ける。HDS-Rと併用推奨。</p></div>}
      relatedTools={[{ slug: 'hds-r', name: 'HDS-R' }, { slug: 'barthel-index', name: 'Barthel Index' }, { slug: 'iadl', name: 'IADL' }]}
      references={toolDef.sources || []}
    >
      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-2 p-2 bg-s0 rounded-lg border border-br">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-tx">{s.name}</p>
              <p className="text-[10px] text-muted">{s.desc}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => { const ns = [...scores]; ns[i] = Math.max(0, ns[i] - 1); setScores(ns) }}
                className="w-7 h-7 rounded-lg bg-s1 text-tx font-bold text-sm hover:bg-s2">−</button>
              <span className="w-8 text-center text-sm font-bold text-tx">{scores[i]}</span>
              <button onClick={() => { const ns = [...scores]; ns[i] = Math.min(s.max, ns[i] + 1); setScores(ns) }}
                className="w-7 h-7 rounded-lg bg-s1 text-tx font-bold text-sm hover:bg-s2">+</button>
              <span className="text-[10px] text-muted w-4">/{s.max}</span>
            </div>
          </div>
        ))}
      </div>
    </CalculatorLayout>
  )
}
