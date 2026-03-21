'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('nihss')!

interface NihssItem {
  id: string
  name: string
  options: { label: string; points: number }[]
}

const items: NihssItem[] = [
  {
    id: '1a', name: '1a. 意識水準',
    options: [
      { label: '完全覚醒', points: 0 },
      { label: '簡単な刺激で覚醒', points: 1 },
      { label: '繰り返し刺激・強い刺激で覚醒', points: 2 },
      { label: '反射的運動のみ／無反応', points: 3 },
    ],
  },
  {
    id: '1b', name: '1b. 意識障害−質問（月・年齢）',
    options: [
      { label: '両方正答', points: 0 },
      { label: '1つ正答', points: 1 },
      { label: '両方不正答', points: 2 },
    ],
  },
  {
    id: '1c', name: '1c. 意識障害−従命（開閉眼・握手）',
    options: [
      { label: '両方可能', points: 0 },
      { label: '1つ可能', points: 1 },
      { label: '両方不可能', points: 2 },
    ],
  },
  {
    id: '2', name: '2. 最良の注視',
    options: [
      { label: '正常', points: 0 },
      { label: '部分的注視麻痺', points: 1 },
      { label: '完全注視麻痺（共同偏視）', points: 2 },
    ],
  },
  {
    id: '3', name: '3. 視野',
    options: [
      { label: '視野欠損なし', points: 0 },
      { label: '部分的半盲', points: 1 },
      { label: '完全半盲', points: 2 },
      { label: '両側性半盲（皮質盲を含む）', points: 3 },
    ],
  },
  {
    id: '4', name: '4. 顔面麻痺',
    options: [
      { label: '正常', points: 0 },
      { label: '軽度の麻痺（鼻唇溝の平坦化等）', points: 1 },
      { label: '部分的麻痺（下半分の麻痺）', points: 2 },
      { label: '完全麻痺（片側または両側）', points: 3 },
    ],
  },
  {
    id: '5a', name: '5a. 上肢の運動（左）',
    options: [
      { label: '下垂なく90°(45°)を10秒保持', points: 0 },
      { label: '10秒以内に下垂', points: 1 },
      { label: '重力に抗するが90°(45°)まで保持不能', points: 2 },
      { label: '重力に抗せず', points: 3 },
      { label: '全く動かない', points: 4 },
    ],
  },
  {
    id: '5b', name: '5b. 上肢の運動（右）',
    options: [
      { label: '下垂なく90°(45°)を10秒保持', points: 0 },
      { label: '10秒以内に下垂', points: 1 },
      { label: '重力に抗するが90°(45°)まで保持不能', points: 2 },
      { label: '重力に抗せず', points: 3 },
      { label: '全く動かない', points: 4 },
    ],
  },
  {
    id: '6a', name: '6a. 下肢の運動（左）',
    options: [
      { label: '下垂なく30°を5秒保持', points: 0 },
      { label: '5秒以内に下垂', points: 1 },
      { label: '重力に抗するが30°まで保持不能', points: 2 },
      { label: '重力に抗せず', points: 3 },
      { label: '全く動かない', points: 4 },
    ],
  },
  {
    id: '6b', name: '6b. 下肢の運動（右）',
    options: [
      { label: '下垂なく30°を5秒保持', points: 0 },
      { label: '5秒以内に下垂', points: 1 },
      { label: '重力に抗するが30°まで保持不能', points: 2 },
      { label: '重力に抗せず', points: 3 },
      { label: '全く動かない', points: 4 },
    ],
  },
  {
    id: '7', name: '7. 運動失調',
    options: [
      { label: 'なし', points: 0 },
      { label: '1肢', points: 1 },
      { label: '2肢', points: 2 },
    ],
  },
  {
    id: '8', name: '8. 感覚',
    options: [
      { label: '正常', points: 0 },
      { label: '軽度〜中等度の障害', points: 1 },
      { label: '重度〜完全な感覚脱失', points: 2 },
    ],
  },
  {
    id: '9', name: '9. 最良の言語',
    options: [
      { label: '正常、失語なし', points: 0 },
      { label: '軽度〜中等度の失語', points: 1 },
      { label: '重度の失語', points: 2 },
      { label: '完全失語・無言', points: 3 },
    ],
  },
  {
    id: '10', name: '10. 構音障害',
    options: [
      { label: '正常', points: 0 },
      { label: '軽度〜中等度', points: 1 },
      { label: '重度（聞き取れない）', points: 2 },
    ],
  },
  {
    id: '11', name: '11. 消去現象と注意障害',
    options: [
      { label: '異常なし', points: 0 },
      { label: '1つのモダリティで消去現象', points: 1 },
      { label: '重度の半側無視・2つ以上の消去現象', points: 2 },
    ],
  },
]

function getSeverity(score: number): 'ok' | 'wn' | 'dn' {
  if (score <= 4) return 'ok'
  if (score <= 15) return 'wn'
  return 'dn'
}

function getLabel(score: number): string {
  if (score === 0) return '正常'
  if (score <= 4) return '軽症脳卒中'
  if (score <= 15) return '中等症脳卒中'
  if (score <= 24) return '重症脳卒中'
  return '最重症脳卒中'
}

function getTpaNote(score: number): string {
  if (score >= 5 && score <= 25) return 'rt-PA静注療法の適応を検討（発症4.5時間以内）'
  if (score < 5) return '一般にrt-PA適応外（軽症）'
  return '予後不良が予測される重症例'
}

export default function NihssPage() {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(items.map(item => [item.id, 0]))
  )

  const result = useMemo(() => {
    const total = Object.values(scores).reduce((a, b) => a + b, 0)
    return {
      total,
      label: getLabel(total),
      severity: getSeverity(total),
      tpaNote: getTpaNote(total),
    }
  }, [scores])

  return (
    <CalculatorLayout
      slug={toolDef.slug}
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={
        <ResultCard
          label="NIHSS"
          value={result.total}
          unit="/ 42点"
          interpretation={result.label}
          severity={result.severity}
          details={[
            { label: 't-PA判断', value: result.tpaNote },
          ]}
        />
      }
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">NIHSS（NIH Stroke Scale）とは</h2>
          <p>NIHSSは脳卒中の神経学的重症度を定量的に評価する15項目のスケールです。合計0〜42点で、スコアが高いほど重症。rt-PA静注療法の適応判断や治療効果の経時的評価に用いられます。</p>
          <h3 className="font-bold text-tx">重症度分類</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>0: 正常</li>
            <li>1〜4: 軽症</li>
            <li>5〜15: 中等症</li>
            <li>16〜24: 重症</li>
            <li>25〜42: 最重症</li>
          </ul>
          <h3 className="font-bold text-tx">rt-PA適応の目安</h3>
          <p>一般にNIHSS 5〜25が静注rt-PA療法の適応範囲とされますが、個別の臨床判断が最優先です。軽症例（NIHSS &lt; 5）でも主幹動脈閉塞では血栓回収術の適応となることがあります。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Brott T, et al. Stroke 1989;20:864-870' },
        { text: '日本脳卒中学会 脳卒中治療ガイドライン2021' },
      ]}
    >
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id}>
            <label className="block text-sm font-medium text-tx mb-1">{item.name}</label>
            <select
              value={scores[item.id]}
              onChange={e => setScores(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-tx
                         focus:outline-none focus:ring-2 focus:ring-ac/30 focus:border-ac text-sm"
            >
              {item.options.map(opt => (
                <option key={opt.points} value={opt.points}>
                  {opt.points}点 — {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </CalculatorLayout>
  )
}
