'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('jcs')!

const levels = [
  { group: 'I. 覚醒している（1桁）', items: [
    { value: '0', label: '0: 意識清明', points: 0 },
    { value: 'I-1', label: 'I-1: 見当識は保たれているが意識清明ではない', points: 1 },
    { value: 'I-2', label: 'I-2: 見当識障害がある', points: 2 },
    { value: 'I-3', label: 'I-3: 自分の名前・生年月日が言えない', points: 3 },
  ]},
  { group: 'II. 刺激に応じて覚醒する（2桁）', items: [
    { value: 'II-10', label: 'II-10: 普通の呼びかけで開眼する', points: 10 },
    { value: 'II-20', label: 'II-20: 大声で呼びかけたり強く揺すると開眼する', points: 20 },
    { value: 'II-30', label: 'II-30: 痛み刺激を加えつつ呼びかけを続けるとかろうじて開眼する', points: 30 },
  ]},
  { group: 'III. 刺激しても覚醒しない（3桁）', items: [
    { value: 'III-100', label: 'III-100: 痛みに対して払いのける動作をする', points: 100 },
    { value: 'III-200', label: 'III-200: 痛み刺激で手足を動かしたり顔をしかめる', points: 200 },
    { value: 'III-300', label: 'III-300: 痛み刺激に全く反応しない', points: 300 },
  ]},
]

const suffixes = [
  { id: 'R', label: 'R（不穏 restlessness）' },
  { id: 'I', label: 'I（便・尿失禁 incontinence）' },
  { id: 'A', label: 'A（自発性喪失 akinetic mutism/apallic state）' },
]

export default function JcsPage() {
  const [selected, setSelected] = useState('0')
  const [checkedSuffix, setCheckedSuffix] = useState<Record<string, boolean>>({})

  const result = useMemo(() => {
    const level = levels.flatMap(g => g.items).find(i => i.value === selected)!
    const suf = Object.entries(checkedSuffix).filter(([, v]) => v).map(([k]) => k).join('')
    const display = level.points === 0 ? '0（清明）' : `${selected}${suf ? '-' + suf : ''}`

    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (level.points >= 100) severity = 'dn'
    else if (level.points >= 10) severity = 'wn'
    else if (level.points >= 2) severity = 'wn'

    return { display, label: level.label, severity }
  }, [selected, checkedSuffix])

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
          label="JCS"
          value={result.display}
          interpretation={result.label}
          severity={result.severity}
        />
      }
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">JCS（Japan Coma Scale）とは</h2>
          <p>日本で最も広く使われる意識障害の評価スケール。太田らが1974年に提唱。I（1桁: 覚醒）、II（2桁: 刺激で覚醒）、III（3桁: 覚醒しない）の3段階×3レベル。</p>
          <h3 className="font-bold text-tx">付加情報（R, I, A）</h3>
          <p>R: 不穏、I: 便尿失禁、A: 自発性喪失（無動性無言/失外套症候群）。例: JCS III-200-RI</p>
          <h3 className="font-bold text-tx">GCSとの対応（目安）</h3>
          <p>JCS 0 = GCS 15、JCS I-3 ≈ GCS 14、JCS II-10 ≈ GCS 11-13、JCS III-100 ≈ GCS 6-8、JCS III-300 ≈ GCS 3</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: '太田富雄 他. 脳神経外科 1974;2:623-627' }, { text: '日本脳神経外科学会 意識障害の分類' }]}
    >
      <div className="space-y-4">
        {levels.map(group => (
          <div key={group.group}>
            <p className="text-sm font-semibold text-tx mb-2">{group.group}</p>
            {group.items.map(item => (
              <label key={item.value} className="flex items-start gap-3 cursor-pointer py-1.5">
                <input type="radio" name="jcs" value={item.value} checked={selected === item.value} onChange={() => setSelected(item.value)} className="mt-0.5 w-4 h-4 text-ac" />
                <span className="text-sm text-tx">{item.label}</span>
              </label>
            ))}
          </div>
        ))}
        <div>
          <p className="text-sm font-semibold text-tx mb-2">付加情報</p>
          {suffixes.map(s => (
            <label key={s.id} className="flex items-center gap-3 cursor-pointer py-1">
              <input type="checkbox" checked={!!checkedSuffix[s.id]} onChange={e => setCheckedSuffix(prev => ({ ...prev, [s.id]: e.target.checked }))} className="w-4 h-4 rounded border-br text-ac" />
              <span className="text-sm text-tx">{s.label}</span>
            </label>
          ))}
        </div>
      </div>
    </CalculatorLayout>
  )
}
