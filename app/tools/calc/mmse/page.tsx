'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('mmse')!

// 著作権に配慮し、項目の概要のみ記載。具体的な質問文・刺激語は掲載しない。
const sections = [
  { name: '① 時に関する見当識', max: 5, desc: '日、年、季節、曜日、月など5項目を確認する' },
  { name: '② 場所に関する見当識', max: 5, desc: '都道府県、市町村、場所、階数、地方など5項目を確認する' },
  { name: '③ 3つの言葉の記銘', max: 3, desc: '事前の記銘を指示後、3つの単語を1つずつ伝え、繰り返し言ってもらう。最大6回まで繰り返す' },
  { name: '④ 100から7を引いていく計算問題', max: 5, desc: '100から7を引いた数を繰り返し言ってもらう。最大5回繰り返し' },
  { name: '⑤ 3つの言葉の遅延再生', max: 3, desc: '③で覚えてもらった3つの言葉をもう一度言ってもらう' },
  { name: '⑥ 物品の呼称', max: 2, desc: '物品を見せながら呼称してもらう、2問行う' },
  { name: '⑦ 文章の復唱', max: 1, desc: '特定の文章をゆっくり伝え復唱してもらう' },
  { name: '⑧ 口頭による命令動作', max: 3, desc: '口頭で3つの命令を行う' },
  { name: '⑨ 読字理解', max: 1, desc: '読字後、指示どおりの動きができるかどうかを確認する' },
  { name: '⑩ 自発書字', max: 1, desc: '自発書字を指示し、鉛筆と紙を渡す。文章はどんなものでも構わないが、意味のない文章は誤答' },
  { name: '⑪ 図形描写', max: 1, desc: '図形描写を指示し、鉛筆と紙を渡す。交差する2つの五角形の図形が模写できれば正答' },
]

export default function MmsePage() {
  const [scores, setScores] = useState(sections.map(s => s.max))
  const result = useMemo(() => {
    const total = scores.reduce((a, b) => a + b, 0)
    let severity: 'ok' | 'wn' | 'dn' = 'ok', interpretation = ''
    if (total >= 27) { interpretation = `${total}/30 — 正常範囲` }
    else if (total >= 24) { interpretation = `${total}/30 — 軽度低下（境界域）`; severity = 'wn' }
    else if (total >= 20) { interpretation = `${total}/30 — 軽度認知症疑い`; severity = 'wn' }
    else if (total >= 10) { interpretation = `${total}/30 — 中等度認知症疑い`; severity = 'dn' }
    else { interpretation = `${total}/30 — 重度認知症疑い`; severity = 'dn' }
    return { total, severity, interpretation }
  }, [scores])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={
        <div className="space-y-2">
          <ResultCard severity={result.severity} value={`MMSE = ${result.total}/30`} interpretation={result.interpretation} />
        </div>
      }
      explanation={<div className="text-sm text-muted space-y-2">
        <p>23/24点をカットオフとして認知症のスクリーニングに使用。教育歴の影響を受ける。HDS-Rと併用推奨。</p>
        <div className="bg-dnl border border-dnb rounded-xl p-3">
          <p className="text-xs font-bold text-dn">著作権に関する注意</p>
          <p className="text-xs text-dn mt-1">MMSEの著作権は2001年にPsychological Assessment Resources（PAR）社に移管されており、具体的な質問文・刺激語の複製には同社のライセンスが必要です。本ツールでは各項目の概要のみを記載しています。</p>
          <p className="text-xs text-dn mt-1">実際の施行には、PAR社との契約に基づき作成された正規日本語版「MMSE-J」（日本文化科学社）を購入または契約のうえ使用してください。</p>
        </div>
      </div>}
      relatedTools={[{ slug: 'hds-r', name: 'HDS-R（長谷川式）' }, { slug: 'barthel-index', name: 'Barthel Index' }]}
      references={[
        { text: 'Folstein MF, et al. "Mini-mental state". A practical method for grading the cognitive state of patients for the clinician. J Psychiatr Res 1975;12(3):189-98. PMID: 1202204' },
        { text: 'Newman JC, Feldman R. Copyright and open access at the bedside. N Engl J Med 2011;365(26):2447-9' },
      ]}
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
