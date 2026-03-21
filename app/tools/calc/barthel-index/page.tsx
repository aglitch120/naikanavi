'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('barthel-index')!

const items = [
  { id: 'feeding', name: '食事', options: [{ label: '自立', points: 10 }, { label: '部分介助', points: 5 }, { label: '全介助', points: 0 }] },
  { id: 'transfer', name: '車椅子⇔ベッド移乗', options: [{ label: '自立', points: 15 }, { label: '軽度介助', points: 10 }, { label: '座れるが移乗に介助', points: 5 }, { label: '不可能', points: 0 }] },
  { id: 'grooming', name: '整容（洗面・歯磨き等）', options: [{ label: '自立', points: 5 }, { label: '介助', points: 0 }] },
  { id: 'toilet', name: 'トイレ動作', options: [{ label: '自立', points: 10 }, { label: '部分介助', points: 5 }, { label: '全介助', points: 0 }] },
  { id: 'bathing', name: '入浴', options: [{ label: '自立', points: 5 }, { label: '介助', points: 0 }] },
  { id: 'mobility', name: '歩行（平地）', options: [{ label: '45m以上自立', points: 15 }, { label: '45m以上介助', points: 10 }, { label: '車椅子45m以上', points: 5 }, { label: '不可能', points: 0 }] },
  { id: 'stairs', name: '階段昇降', options: [{ label: '自立', points: 10 }, { label: '介助', points: 5 }, { label: '不可能', points: 0 }] },
  { id: 'dressing', name: '着替え', options: [{ label: '自立', points: 10 }, { label: '部分介助', points: 5 }, { label: '全介助', points: 0 }] },
  { id: 'bowels', name: '排便コントロール', options: [{ label: '失禁なし', points: 10 }, { label: '時に失禁', points: 5 }, { label: '常に失禁', points: 0 }] },
  { id: 'bladder', name: '排尿コントロール', options: [{ label: '失禁なし', points: 10 }, { label: '時に失禁', points: 5 }, { label: '常に失禁', points: 0 }] },
]

export default function BarthelIndexPage() {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(items.map(item => [item.id, item.options[0].points]))
  )

  const result = useMemo(() => {
    const total = Object.values(scores).reduce((a, b) => a + b, 0)
    let interpretation = ''; let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (total === 100) { interpretation = '完全自立'; severity = 'ok' }
    else if (total >= 85) { interpretation = '軽度依存 — 概ね自立'; severity = 'ok' }
    else if (total >= 60) { interpretation = '中等度依存 — 部分介助が必要'; severity = 'wn' }
    else if (total >= 40) { interpretation = '重度依存 — 多くの場面で介助'; severity = 'dn' }
    else { interpretation = '全面依存 — ほぼ全介助'; severity = 'dn' }
    return { total, interpretation, severity }
  }, [scores])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Barthel Index" value={result.total} unit="/ 100" interpretation={result.interpretation} severity={result.severity}
        details={[{ label: '100: 完全自立', value: '85-100: 軽度依存, 60-84: 中等度, < 60: 重度' }]} />}
      explanation={<section className="space-y-4 text-sm text-muted">
        <h2 className="text-base font-bold text-tx">Barthel Indexとは</h2>
        <p>日常生活動作（ADL）を10項目で評価。0〜100点。リハビリの目標設定、介護度判定、退院先の決定に使用。60点以上で部分自立の目安。</p>
        <h3 className="font-bold text-tx">FIM（機能的自立度評価表）との違い</h3>
        <p>BIは10項目・5分で評価可能な簡便さが利点。FIMは18項目・認知項目を含みより詳細。スクリーニングにはBI、詳細評価にはFIMを使い分けます。</p>
      </section>}
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Mahoney FI, Barthel DW. Md State Med J 1965;14:61-65' }]}
    >
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id}>
            <label className="block text-sm font-medium text-tx mb-1">{item.name}</label>
            <select value={scores[item.id]} onChange={e => setScores(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-tx focus:outline-none focus:ring-2 focus:ring-ac/30 focus:border-ac text-sm">
              {item.options.map(opt => (<option key={opt.points} value={opt.points}>{opt.label}（{opt.points}点）</option>))}
            </select>
          </div>
        ))}
      </div>
    </CalculatorLayout>
  )
}
