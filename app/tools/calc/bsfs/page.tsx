'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('bsfs')!
const types = [
  { type: 1, desc: '硬くコロコロの兎糞状', clinical: '重度の便秘', emoji: '🟤', severity: 'dn' as const },
  { type: 2, desc: 'ソーセージ状だが硬い', clinical: '便秘', emoji: '🟤', severity: 'wn' as const },
  { type: 3, desc: '表面にひび割れのあるソーセージ状', clinical: '正常（やや硬め）', emoji: '🟢', severity: 'ok' as const },
  { type: 4, desc: '滑らかで軟らかいソーセージ/蛇状', clinical: '正常（理想的）', emoji: '🟢', severity: 'ok' as const },
  { type: 5, desc: '軟らかい半固形状（辺縁明瞭）', clinical: '正常（やや軟らかめ）', emoji: '🟢', severity: 'ok' as const },
  { type: 6, desc: 'ふわふわの不定形・泥状', clinical: '下痢傾向', emoji: '🟡', severity: 'wn' as const },
  { type: 7, desc: '水様・固形物なし', clinical: '下痢', emoji: '🔴', severity: 'dn' as const },
]
export default function BsfsPage() {
  const [selected, setSelected] = useState(3)
  const t = types[selected]
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={t.severity} value={`Type ${t.type}`} interpretation={`${t.desc}\n→ ${t.clinical}\n\nType 3-5が正常範囲。Type 1-2は便秘、Type 6-7は下痢を示す。`} />}
      explanation={<div className="text-sm text-muted"><p>便の形状を7段階で評価。IBS-Romeとの併用で腸管通過時間の客観的指標になる。</p></div>}
      relatedTools={[{ href: '/tools/calc/ibs-rome', name: 'IBS Rome IV' }]}
      references={toolDef.sources || []}
    >
      <div className="space-y-2">
        {types.map((tp, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 ${selected === i ? 'bg-acl border-2 border-ac/40' : 'bg-s0 border border-br hover:border-ac/20'}`}>
            <span className="text-lg">{tp.emoji}</span>
            <div>
              <span className="text-sm font-bold text-tx">Type {tp.type}</span>
              <p className="text-xs text-muted">{tp.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </CalculatorLayout>
  )
}
